import { env } from "../../config/env.js";
import { GeminiService, type GeminiPart } from "../../services/gemini.js";
import { buildChunks, type TextChunk, type ExtractedPage } from "./questionImport.chunker.js";
import { buildDocumentQuestionExtractionPrompt, buildQuestionDetectionPrompt, buildQuestionParsingPrompt, buildRepairPrompt, buildVerificationPrompt } from "./questionImport.prompt.js";
import {
  geminiQuestionResponseSchema,
  geminiRawQuestionResponseSchema,
  geminiSingleQuestionResponseSchema,
  parsedQuestionArraySchema,
  parsedQuestionSchema,
  rawQuestionArraySchema,
  type ParsedQuestion,
  type ParsedSubQuestion,
  type RawQuestion
} from "./questionImport.schema.js";

type ParseDocumentResult = {
  questions: ParsedQuestion[];
  warnings: string[];
  metrics: {
    chunkCount: number;
    rawQuestionCount: number;
    verificationQuestionCount: number;
    retries: number;
    requestCharacters: number;
    parsingTimeMs: number;
  };
};

type AttemptResult<T> = {
  data: T | null;
  warnings: string[];
  retries: number;
};

type ParsedChunk = {
  chunk: TextChunk;
  rawQuestions: RawQuestion[];
  parsedQuestions: ParsedQuestion[];
  verificationQuestions: RawQuestion[];
  warnings: string[];
  retries: number;
};

const gemini = new GeminiService();

let geminiCircuitBreakerTrippedUntil = 0;

export function isGeminiCircuitOpen(): boolean {
  return Date.now() < geminiCircuitBreakerTrippedUntil;
}

export function tripGeminiCircuit(cooldownMs = 60000) {
  geminiCircuitBreakerTrippedUntil = Date.now() + cooldownMs;
  console.warn(`[Gemini CircuitBreaker] Tripped due to rate/quota limits. Cooldown ${cooldownMs / 1000}s. Using fast deterministic parser.`);
}

function normalizeMimeType(mimeType: string | undefined, header: string, importType: string): string {
  let mime = (mimeType || "").trim().toLowerCase();
  if (!mime) {
    const match = header.match(/data:([^;]+);base64/i);
    mime = match ? match[1].toLowerCase() : "";
  }
  if (mime === "image/jpg" || mime === "image/pjpeg") return "image/jpeg";
  if (mime === "image/x-png") return "image/png";
  if (mime === "application/x-pdf") return "application/pdf";
  if (mime.startsWith("image/")) return mime;
  if (importType === "pdf" || mime.includes("pdf")) return "application/pdf";
  return "image/jpeg";
}

export function extractJsonFromText(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    return trimmed;
  }
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    return trimmed.slice(firstBracket, lastBracket + 1);
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

export function safeJsonParse<T = unknown>(value: string): T {
  let extracted = extractJsonFromText(value);
  // Pre-emptively double-escape LaTeX keywords where \f, \t, \b, \r would otherwise be interpreted as JSON control characters
  extracted = extracted
    .replace(/(?<!\\)\\frac/g, "\\\\frac")
    .replace(/(?<!\\)\\times/g, "\\\\times")
    .replace(/(?<!\\)\\text/g, "\\\\text")
    .replace(/(?<!\\)\\tan/g, "\\\\tan")
    .replace(/(?<!\\)\\theta/g, "\\\\theta")
    .replace(/(?<!\\)\\tau/g, "\\\\tau")
    .replace(/(?<!\\)\\begin/g, "\\\\begin")
    .replace(/(?<!\\)\\beta/g, "\\\\beta")
    .replace(/(?<!\\)\\binom/g, "\\\\binom")
    .replace(/(?<!\\)\\right/g, "\\\\right")
    .replace(/(?<!\\)\\rho/g, "\\\\rho");

  try {
    return JSON.parse(extracted) as T;
  } catch (initialErr) {
    // Attempt 1: Fix unescaped backslashes from LaTeX (e.g. \frac, \sqrt, \times in JSON strings)
    try {
      const fixedEscapes = extracted.replace(/(?<!\\)\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, "\\\\");
      return JSON.parse(fixedEscapes) as T;
    } catch {
      // Attempt 2: If JSON was cut off / truncated near the end, auto-close open structures
      try {
        let trimmed = extracted.trim().replace(/,\s*([}\]])/g, "$1").replace(/,\s*$/, "");
        let openBraces = 0;
        let openBrackets = 0;
        let inString = false;
        let escaped = false;

        for (let i = 0; i < trimmed.length; i++) {
          const char = trimmed[i];
          if (escaped) {
            escaped = false;
            continue;
          }
          if (char === "\\") {
            escaped = true;
            continue;
          }
          if (char === '"') {
            inString = !inString;
            continue;
          }
          if (!inString) {
            if (char === "{") openBraces++;
            else if (char === "}") openBraces = Math.max(0, openBraces - 1);
            else if (char === "[") openBrackets++;
            else if (char === "]") openBrackets = Math.max(0, openBrackets - 1);
          }
        }

        if (inString) trimmed += '"';
        while (openBraces > 0) {
          trimmed += "}";
          openBraces--;
        }
        while (openBrackets > 0) {
          trimmed += "]";
          openBrackets--;
        }

        const fixedCutoff = trimmed.replace(/(?<!\\)\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, "\\\\");
        return JSON.parse(fixedCutoff) as T;
      } catch {
        throw initialErr;
      }
    }
  }
}

export function parseRawQuestionsSafe(rawParsed: unknown): ParsedQuestion[] {
  let list: unknown[] = [];
  if (Array.isArray(rawParsed)) {
    list = rawParsed;
  } else if (rawParsed && typeof rawParsed === "object") {
    const obj = rawParsed as Record<string, unknown>;
    if (Array.isArray(obj.questions)) list = obj.questions;
    else if (Array.isArray(obj.items)) list = obj.items;
    else if (Array.isArray(obj.data)) list = obj.data;
    else if (Array.isArray(obj.results)) list = obj.results;
    else if (obj.title || obj.question || obj.stem) list = [obj];
  }

  const results: ParsedQuestion[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;

    const title = String(raw.title || raw.question || raw.stem || raw.text || "").trim();
    if (!title) continue;

    let rawOptions: unknown[] = [];
    if (Array.isArray(raw.options)) {
      rawOptions = raw.options;
    } else if (raw.options && typeof raw.options === "object") {
      rawOptions = Object.values(raw.options);
    }
    const options = rawOptions
      .map((opt) => String(opt).trim())
      .map((opt) => opt.replace(/^(\([A-Da-dক-ঘ]\)|[A-Da-dক-ঘ][.)\s]|(?:ক|খ|গ|ঘ)[.)\s])\s*/u, "").trim())
      .filter(Boolean);

    let correct: number | null = null;
    if (typeof raw.correct === "number") {
      correct = raw.correct;
    } else if (typeof raw.correct === "string") {
      const cStr = raw.correct.trim().toLowerCase();
      if (cStr === "a" || cStr === "ক" || cStr === "0") correct = 0;
      else if (cStr === "b" || cStr === "খ" || cStr === "1") correct = 1;
      else if (cStr === "c" || cStr === "গ" || cStr === "2") correct = 2;
      else if (cStr === "d" || cStr === "ঘ" || cStr === "3") correct = 3;
      else if (/^\d+$/.test(cStr)) correct = parseInt(cStr, 10);
    }

    let subQuestions: ParsedSubQuestion[] | undefined = undefined;
    if (Array.isArray(raw.subQuestions) && raw.subQuestions.length > 0) {
      const defaultLabels = ["ক", "খ", "গ", "ঘ"];
      const defaultMarks = [1, 2, 3, 4];
      subQuestions = raw.subQuestions.map((sq, idx) => {
        const sqObj = (sq && typeof sq === "object" ? sq : {}) as Record<string, unknown>;
        return {
          id: sqObj.id ? String(sqObj.id) : undefined,
          label: sqObj.label ? String(sqObj.label) : defaultLabels[idx] || String(idx + 1),
          text: String(sqObj.text || sqObj.question || sqObj.title || "").trim(),
          marks: sqObj.marks !== undefined && sqObj.marks !== null ? Number(sqObj.marks) : defaultMarks[idx] || 1,
          answer: sqObj.answer ? String(sqObj.answer) : null,
          explanation: sqObj.explanation ? String(sqObj.explanation) : null
        };
      }).filter((sq) => sq.text.length > 0);
    }

    const isCq = (subQuestions && subQuestions.length > 0) || raw.type === "cq" || raw.type === "creative";
    const hasOptions = options.length >= 2;
    let type: ParsedQuestion["type"] = "mcq";
    if (isCq) {
      type = "cq";
    } else if (!hasOptions) {
      type = (raw.type === "written" || raw.type === "cq" || raw.type === "fill_blank") ? (raw.type as any) : "written";
    }

    const marks = raw.marks !== undefined && raw.marks !== null
      ? Number(raw.marks)
      : isCq
        ? (subQuestions?.reduce((s, q) => s + (q.marks || 0), 0) || 10)
        : 1;

    results.push({
      title,
      subtitle: raw.subtitle ? String(raw.subtitle).trim() : null,
      marks: Number.isNaN(marks) ? (isCq ? 10 : 1) : marks,
      options,
      correct,
      explanation: raw.explanation ? String(raw.explanation).trim() : null,
      warnings: Array.isArray(raw.warnings) ? raw.warnings.map(String) : [],
      type,
      number: raw.number ? String(raw.number).trim() : null,
      images: Array.isArray(raw.images) ? raw.images.map(String) : [],
      tables: Array.isArray(raw.tables) ? (raw.tables as any) : [],
      subQuestions
    });
  }

  return results;
}

export async function parseMultimodalDocument(
  importType: "image" | "pdf" | "docx",
  files: Array<{ name: string; mimeType?: string; dataUrl: string }>,
  textPagesFallback: ExtractedPage[] = []
): Promise<ParseDocumentResult> {
  const started = Date.now();
  const collectedWarnings: string[] = [];

  // 1. Direct Multimodal Vision with Gemini for Images and PDFs
  if (env.GEMINI_API_KEY && !isGeminiCircuitOpen() && (importType === "image" || importType === "pdf")) {
    const parts: GeminiPart[] = [];
    let totalChars = 0;

    for (const file of files) {
      const [header, base64Data = ""] = file.dataUrl.split(",");
      if (!base64Data) continue;
      const mimeType = normalizeMimeType(file.mimeType, header, importType);
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data
        }
      });
      totalChars += base64Data.length;
    }

    if (parts.length > 0) {
      parts.push({
        text: buildDocumentQuestionExtractionPrompt()
      });

      console.log(`[QuestionImport] Sending ${parts.length - 1} document part(s) (~${(totalChars / 1024 / 1024).toFixed(2)} MB) to Gemini...`);

      // Attempt 1: with structured schema
      let geminiResult = await gemini.generateJson({
        parts,
        responseSchema: geminiQuestionResponseSchema
      });

      const isQuotaError = Boolean(
        geminiResult?.error &&
        (geminiResult.error.includes("429") ||
         geminiResult.error.includes("Quota exceeded") ||
         geminiResult.error.includes("RESOURCE_EXHAUSTED"))
      );

      if (isQuotaError) {
        tripGeminiCircuit(60000);
        collectedWarnings.push("Gemini free-tier quota exhausted; falling back to local deterministic parser.");
      } else if (!geminiResult?.text && geminiResult?.error) {
        console.warn(`[QuestionImport] Retrying multimodal extraction without responseSchema due to: ${geminiResult.error}`);
        collectedWarnings.push(`Initial schema attempt: ${geminiResult.error}`);
        geminiResult = await gemini.generateJson({ parts });
      }

      if (geminiResult?.text) {
        try {
          const rawParsed = safeJsonParse(geminiResult.text);
          const safeQuestions = parseRawQuestionsSafe(rawParsed);
          const normalized = normalizeQuestions(safeQuestions);

          if (normalized.length > 0) {
            console.log(`[QuestionImport] Successfully parsed ${normalized.length} question(s) via Gemini Multimodal Vision in ${Date.now() - started}ms`);
            return {
              questions: mergeQuestions(normalized),
              warnings: collectedWarnings,
              metrics: {
                chunkCount: 1,
                rawQuestionCount: normalized.length,
                verificationQuestionCount: 0,
                retries: 0,
                requestCharacters: totalChars,
                parsingTimeMs: Date.now() - started
              }
            };
          } else {
            console.warn("[QuestionImport] Multimodal vision returned valid JSON but 0 questions were parsed from it.");
          }
        } catch (parseErr) {
          const errDetail = parseErr instanceof Error ? parseErr.message : String(parseErr);
          console.warn("[QuestionImport] Failed to parse multimodal JSON response:", errDetail);
          collectedWarnings.push(`JSON parsing error: ${errDetail}`);
        }
      } else if (geminiResult?.error) {
        collectedWarnings.push(geminiResult.error);
      }
    }
  }

  // 2. Text-based parsing fallback (or DOCX text parsing)
  if (textPagesFallback.length > 0) {
    console.log(`[QuestionImport] Multimodal vision yielded no questions, falling back to text parsing (${textPagesFallback.length} pages)...`);
    return parseQuestionDocument(textPagesFallback, collectedWarnings);
  }

  return {
    questions: [],
    warnings: collectedWarnings.length > 0 ? collectedWarnings : ["No questions could be extracted from the document."],
    metrics: {
      chunkCount: 0,
      rawQuestionCount: 0,
      verificationQuestionCount: 0,
      retries: 0,
      requestCharacters: 0,
      parsingTimeMs: Date.now() - started
    }
  };
}

export async function parseQuestionDocument(pages: ExtractedPage[], inheritedWarnings: string[] = []): Promise<ParseDocumentResult> {
  const started = Date.now();
  const limitedPages = pages;
  const fullText = limitedPages.map((page) => page.text).join("\n\n").trim();

  // 1. High-accuracy fast deterministic parser pass
  const deterministicQuestions = parseQuestionsFallback(fullText);

  // If Gemini circuit is tripped, or GEMINI_API_KEY is missing, or deterministic parser successfully extracted questions:
  if (!env.GEMINI_API_KEY || isGeminiCircuitOpen() || deterministicQuestions.length > 0) {
    console.log(`[QuestionImport] Deterministic parser extracted ${deterministicQuestions.length} question(s) in ${Date.now() - started}ms`);
    return {
      questions: deterministicQuestions,
      warnings: Array.from(new Set([...inheritedWarnings, isGeminiCircuitOpen() ? "Gemini rate limited; local deterministic parser used." : ""])).filter(Boolean),
      metrics: {
        chunkCount: 1,
        rawQuestionCount: deterministicQuestions.length,
        verificationQuestionCount: 0,
        retries: 0,
        requestCharacters: fullText.length,
        parsingTimeMs: Date.now() - started
      }
    };
  }

  // 2. Fallback to chunk parsing with Gemini if deterministic parser found 0 questions
  const chunks = buildChunks(limitedPages);
  const requestCharacters = chunks.reduce((sum, chunk) => sum + chunk.text.length, 0);

  debug("question-import:start", { chunkCount: chunks.length, requestCharacters });

  const parsedChunks = await mapWithConcurrency(chunks, env.PARSER_CONCURRENCY, parseChunk);
  const questions = mergeQuestions(parsedChunks.flatMap((chunk) => chunk.parsedQuestions));
  const warnings = Array.from(new Set([...inheritedWarnings, ...parsedChunks.flatMap((chunk) => chunk.warnings)]));
  const retries = parsedChunks.reduce((sum, chunk) => sum + chunk.retries, 0);
  const rawQuestionCount = parsedChunks.reduce((sum, chunk) => sum + chunk.rawQuestions.length, 0);
  const verificationQuestionCount = parsedChunks.reduce((sum, chunk) => sum + chunk.verificationQuestions.length, 0);

  debug("question-import:done", { questions: questions.length, rawQuestionCount, verificationQuestionCount, retries, parsingTimeMs: Date.now() - started });

  return {
    questions,
    warnings,
    metrics: {
      chunkCount: chunks.length,
      rawQuestionCount,
      verificationQuestionCount,
      retries,
      requestCharacters,
      parsingTimeMs: Date.now() - started
    }
  };
}

async function parseChunk(chunk: TextChunk): Promise<ParsedChunk> {
  const started = Date.now();
  const detected = await detectQuestions(chunk);
  const rawQuestions = detected.data?.length ? detected.data : fallbackRawQuestions(chunk);
  const parsed = await mapWithConcurrency(rawQuestions, env.PARSER_CONCURRENCY, (rawQuestion) => parseRawQuestion(rawQuestion));

  let parsedQuestions = parsed.flatMap((result) => (result.data ? [result.data] : []));
  let warnings = [...detected.warnings, ...parsed.flatMap((result) => result.warnings)];
  let retries = detected.retries + parsed.reduce((sum, result) => sum + result.retries, 0);
  let verificationQuestions: RawQuestion[] = [];

  if (env.PARSER_VERIFICATION_ENABLED && parsedQuestions.length) {
    const verification = await verifyChunk(chunk, parsedQuestions);
    verificationQuestions = verification.data ?? [];
    warnings = [...warnings, ...verification.warnings];
    retries += verification.retries;

    if (verificationQuestions.length) {
      const reparsed = await mapWithConcurrency(verificationQuestions, env.PARSER_CONCURRENCY, (rawQuestion) => parseRawQuestion(rawQuestion));
      parsedQuestions = mergeQuestions([...parsedQuestions, ...reparsed.flatMap((result) => (result.data ? [result.data] : []))]);
      warnings = [...warnings, ...reparsed.flatMap((result) => result.warnings)];
      retries += reparsed.reduce((sum, result) => sum + result.retries, 0);
    }
  }

  debug("question-import:chunk", {
    chunk: chunk.id,
    pages: chunk.pageNumbers,
    rawQuestions: rawQuestions.length,
    parsedQuestions: parsedQuestions.length,
    verificationQuestions: verificationQuestions.length,
    retries,
    elapsedMs: Date.now() - started
  });

  return { chunk, rawQuestions, parsedQuestions: normalizeQuestions(parsedQuestions), verificationQuestions, warnings, retries };
}

async function detectQuestions(chunk: TextChunk): Promise<AttemptResult<RawQuestion[]>> {
  return requestGemini({
    name: `detect:${chunk.id}`,
    prompt: buildQuestionDetectionPrompt(chunk.text),
    responseSchema: geminiRawQuestionResponseSchema,
    parse: (value) => normalizeRawQuestions(rawQuestionArraySchema.parse(value), chunk)
  });
}

async function parseRawQuestion(rawQuestion: RawQuestion): Promise<AttemptResult<ParsedQuestion>> {
  return requestGemini({
    name: `parse:${rawQuestion.number ?? "unknown"}`,
    prompt: buildQuestionParsingPrompt(rawQuestion.raw),
    responseSchema: geminiSingleQuestionResponseSchema,
    parse: (value) => normalizeQuestions([parsedQuestionSchema.parse(value)])[0]
  }).then((result) => {
    if (result.data) {
      result.data.number = result.data.number ?? rawQuestion.number;
      result.data.warnings = Array.from(new Set([...rawQuestion.warnings, ...result.data.warnings]));
    }
    if (!result.data) {
      const fallback = parseQuestionsFallback(rawQuestion.raw)[0] ?? null;
      if (fallback) {
        fallback.number = fallback.number ?? rawQuestion.number;
        fallback.warnings = Array.from(new Set([...rawQuestion.warnings, ...fallback.warnings, "Gemini question parsing failed; conservative fallback was used."]));
        return { ...result, data: fallback };
      }
    }
    return result;
  });
}

async function verifyChunk(chunk: TextChunk, parsedQuestions: ParsedQuestion[]): Promise<AttemptResult<RawQuestion[]>> {
  return requestGemini({
    name: `verify:${chunk.id}`,
    prompt: buildVerificationPrompt(chunk.text, JSON.stringify(parsedQuestions)),
    responseSchema: geminiRawQuestionResponseSchema,
    parse: (value) => normalizeRawQuestions(rawQuestionArraySchema.parse(value), chunk)
  });
}

async function requestGemini<T>({
  name,
  prompt,
  responseSchema,
  parse
}: {
  name: string;
  prompt: string;
  responseSchema: unknown;
  parse: (value: unknown) => T;
}): Promise<AttemptResult<T>> {
  if (isGeminiCircuitOpen()) {
    return { data: null, warnings: ["Gemini circuit is cooling down."], retries: 0 };
  }

  const warnings: string[] = [];
  let retries = 0;
  let nextPrompt = prompt;
  let lastOutput = "";
  let lastError = "";

  for (let attempt = 0; attempt <= env.GEMINI_RETRY_COUNT; attempt += 1) {
    const response = await gemini.generateJson({ prompt: nextPrompt, responseSchema });
    if (!response || !response.text) {
      lastError = response?.error || "Gemini returned an empty response or timed out.";
      warnings.push(lastError);

      if (lastError.includes("429") || lastError.includes("Quota exceeded") || lastError.includes("RESOURCE_EXHAUSTED")) {
        tripGeminiCircuit(60000);
        break; // Stop immediately; do not retry on 429
      }

      if (attempt < env.GEMINI_RETRY_COUNT) retries += 1;
      continue;
    }

    debug("question-import:gemini", { name, attempt, elapsedMs: response.elapsedMs, characters: response.text.length });
    lastOutput = extractJsonFromText(response.text);

    try {
      return { data: parse(safeJsonParse(lastOutput)), warnings, retries };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Invalid Gemini JSON.";
      warnings.push(`${name} validation failed: ${lastError}`);
      if (attempt < env.GEMINI_RETRY_COUNT) {
        retries += 1;
        nextPrompt = buildRepairPrompt(lastOutput, lastError);
      }
    }
  }

  return { data: null, warnings: [...warnings, `${name} failed after retries: ${lastError}`], retries };
}

function normalizeRawQuestions(rawQuestions: RawQuestion[], chunk: TextChunk) {
  return rawQuestions
    .filter((question) => question.raw.trim())
    .map((question) => ({
      ...question,
      page: question.page ?? question.pages[0] ?? chunk.pageNumbers[0] ?? null,
      pages: question.pages.length ? question.pages : question.page ? [question.page] : chunk.pageNumbers,
      number: question.number?.trim() || null,
      raw: question.raw.trim(),
      warnings: Array.from(new Set(question.warnings.filter(Boolean)))
    }));
}

function fallbackRawQuestions(chunk: TextChunk): RawQuestion[] {
  return parseQuestionsFallback(chunk.text).map((question) => ({
    page: chunk.pageNumbers[0] ?? null,
    pages: chunk.pageNumbers,
    number: question.number,
    raw: serializeQuestion(question),
    warnings: ["Gemini question detection failed; conservative fallback was used."]
  }));
}

export function repairLatexEscapes(text: string): string {
  if (!text) return text;
  return text
    .replace(/\x0crac/g, "\\frac")
    .replace(/\x08egin/g, "\\begin")
    .replace(/\x08eta/g, "\\beta")
    .replace(/\x08inom/g, "\\binom")
    .replace(/\times/g, "\\times")
    .replace(/\text/g, "\\text")
    .replace(/\tan/g, "\\tan")
    .replace(/\theta/g, "\\theta")
    .replace(/\tau/g, "\\tau")
    .replace(/\right/g, "\\right")
    .replace(/\rho/g, "\\rho");
}

function unpackSectionQuestions(questions: ParsedQuestion[]): ParsedQuestion[] {
  const result: ParsedQuestion[] = [];
  for (const q of questions) {
    if (
      q.subQuestions &&
      q.subQuestions.length > 0 &&
      /(?:ছোট লিখিত|সংক্ষিপ্ত\s*প্রশ্ন|short\s*questions?)/i.test(q.title)
    ) {
      for (const sq of q.subQuestions) {
        result.push({
          title: sq.text,
          subtitle: null,
          marks: sq.marks || 5,
          options: [],
          correct: null,
          explanation: sq.explanation || null,
          warnings: [],
          type: "written",
          number: sq.label || null,
          images: [],
          tables: []
        });
      }
    } else {
      result.push(q);
    }
  }
  return result;
}

function normalizeQuestions(questions: ParsedQuestion[]) {
  const unpacked = unpackSectionQuestions(questions);
  return unpacked
    .filter((question) => question.title.trim())
    .map((question) => ({
      ...question,
      title: repairLatexEscapes(question.title.trim()),
      subtitle: question.subtitle ? repairLatexEscapes(question.subtitle.trim()) : null,
      options: question.options.map((option) => repairLatexEscapes(String(option).trim())).filter(Boolean),
      explanation: question.explanation ? repairLatexEscapes(question.explanation.trim()) : null,
      subQuestions: question.subQuestions?.map((sq) => ({
        ...sq,
        text: repairLatexEscapes(sq.text),
        answer: sq.answer ? repairLatexEscapes(sq.answer) : null,
        explanation: sq.explanation ? repairLatexEscapes(sq.explanation) : null
      })),
      warnings: Array.from(new Set(question.warnings.filter(Boolean))),
      images: question.images.filter(Boolean),
      tables: question.tables ?? []
    }));
}

export function mergeQuestions(questions: ParsedQuestion[]) {
  const merged: ParsedQuestion[] = [];

  questions.forEach((question) => {
    const duplicateIndex = merged.findIndex(
      (item) => similarity(questionKey(item), questionKey(question)) > 0.94 || (item.number && question.number && item.number === question.number && similarity(item.title, question.title) > 0.82)
    );
    if (duplicateIndex === -1) {
      merged.push(question);
      return;
    }
    if (scoreQuestion(question) > scoreQuestion(merged[duplicateIndex])) merged[duplicateIndex] = question;
  });

  return merged;
}

export function normalizeDigits(str: string): string {
  return str
    .replace(/[\u09e6-\u09ef]/g, (d) => String(d.charCodeAt(0) - 0x09e6))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

// Convert standalone LaTeX commands to KaTeX format if not already wrapped
export function formatStemFormulas(text: string): string {
  if (!text) return "";

  // Helper: do not replace inside existing $...$
  const parts = text.split(/(\$[^\$]+\$)/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // already inside $...$

      let formatted = part;

      // Wrap standalone LaTeX commands with arguments: \frac{a}{b}, \sqrt{x}, \vec{v}, etc.
      formatted = formatted.replace(
        /(?<!\$)\\([a-zA-Z]+(?:\s*\{[^\}]*\})*)(?!\$)/g,
        (m) => `$${m}$`
      );

      // Cleanup adjacent dollars
      formatted = formatted.replace(/\$\s*\$/g, " ");

      return formatted;
    })
    .join("");
}

export type ExtractedOptionsResult = {
  isOption: boolean;
  options: string[];
  answerIndex: number | null;
};

// Extract multiple options from a single line or check if line is an option
export function extractOptionsFromLine(line: string): ExtractedOptionsResult {
  const trimmed = line.trim();

  // Answer patterns: উত্তর: খ, উত্তরঃ (খ), সঠিক উত্তর: খ, Answer: B, Ans: C
  const ansMatch = trimmed.match(/^(?:উত্তর|উত্তরঃ|সঠিক\s*উত্তর|ans(?:wer)?)\s*[:\-–—]?\s*[\(\[]?([A-Da-dক-ঘ1-4১-৪])[\)\]]?/i);
  if (ansMatch) {
    const rawVal = ansMatch[1].toLowerCase();
    const map: Record<string, number> = {
      "a": 0, "ক": 0, "1": 0, "১": 0,
      "b": 1, "খ": 1, "2": 1, "২": 1,
      "c": 2, "গ": 2, "3": 2, "৩": 2,
      "d": 3, "ঘ": 3, "4": 3, "৪": 3
    };
    return { isOption: false, options: [], answerIndex: map[rawVal] ?? null };
  }

  // Check if line contains inline multiple options
  // e.g. "(ক) CO2   (খ) H2O   (গ) NaCl   (ঘ) HCl"
  // or "A) 2x+3  B) x+3  C) 2x  D) 3x"
  const multiOptionPattern = /(?:^|\s{2,}|\t|\s+)(?:[\(\[]?([A-Da-d]|[\u0995-\u0998])[\)\].:\-]|([A-Da-d]|[\u0995-\u0998])\))\s+/gu;
  const matches = Array.from(trimmed.matchAll(multiOptionPattern));

  if (matches.length > 1) {
    const tokens: string[] = [];
    for (let i = 0; i < matches.length; i++) {
      const startIdx = (matches[i].index || 0) + matches[i][0].length;
      const endIdx = i + 1 < matches.length ? matches[i + 1].index! : trimmed.length;
      const optText = trimmed.substring(startIdx, endIdx).trim();
      if (optText) tokens.push(formatStemFormulas(optText));
    }
    return { isOption: true, options: tokens, answerIndex: null };
  }

  // Single option line: "(ক) জুল" or "A) 2x + 3" or "ক. নিউটন"
  const singleOptionMatch = trimmed.match(/^[\(\[]?([A-Da-d]|[\u0995-\u0998])[\)\].:\-]\s+(.+)/u) ||
                           trimmed.match(/^([A-Da-d\u0995-\u0998])\)\s+(.+)/u);

  if (singleOptionMatch) {
    const optText = singleOptionMatch[2].trim();
    return { isOption: true, options: [formatStemFormulas(optText)], answerIndex: null };
  }

  return { isOption: false, options: [], answerIndex: null };
}

// Check if line is a CQ sub-question: ক. ... [১] or a) ... [1]
export function extractCqSubQuestion(line: string): { isSubQuestion: boolean; label: string; text: string; marks: number; hasExplicitMarks: boolean } | null {
  const trimmed = line.trim();

  // Pattern for sub-questions: (ক) / ক. / ক) or (a) / a. / a)
  // Check for marks at the end: [১], [1], (১), (1), [1 mark], [১ নম্বর]
  const subPattern = /^[\(\[]?([a-d]|[ক-ঘ])[\)\].:\-]\s+(.+?)(?:\s*(?:\[|\()([\p{N}\u09e6-\u09ef\d]+)\s*(?:marks?|নম্বর)?(?:\]|\)))?$/iu;
  const match = trimmed.match(subPattern);

  if (!match) return null;

  const rawLabel = match[1];
  const rawText = match[2].trim();
  const hasExplicitMarks = Boolean(match[3]);
  const rawMarks = match[3] ? Number(normalizeDigits(match[3])) : null;

  // Default marks according to Bangladeshi curriculum for CQ: ক=1, খ=2, গ=3, ঘ=4
  const defaultMarksMap: Record<string, number> = {
    "ক": 1, "a": 1,
    "খ": 2, "b": 2,
    "গ": 3, "c": 3,
    "ঘ": 4, "d": 4
  };

  const marks = rawMarks || defaultMarksMap[rawLabel.toLowerCase()] || 1;

  // Directive verbs indicating CQ questions
  const hasCqDirective = /(?:কাকে\s*বলে|কী|কি|বলতে\s*কী|ব্যাখ্যা\s*কর|নির্ণয়\s*কর|বিশ্লেষণ\s*কর|যৌক্তিকতা|প্রমাণ\s*কর|দেখাওয়া|what\s+is|define|explain|calculate|derive|justify|determine|analyze)/iu.test(rawText);

  return {
    isSubQuestion: true,
    label: rawLabel,
    text: formatStemFormulas(rawText),
    marks,
    hasExplicitMarks: hasExplicitMarks || hasCqDirective
  };
}

export function extractMarks(text: string): { marks: number | null; cleanedText: string } {
  const match = text.match(/(?:\s*\[|\(|\b)(?:marks?|points?|নম্বর|মান)?\s*[:\-–—]?\s*([\p{N}\u09e6-\u09ef\d]+(?:\.[\p{N}\u09e6-\u09ef\d]+)?)\s*(?:marks?|points?|নম্বর)?(?:\s*\]|\)|\b)\s*$/iu);
  if (!match) return { marks: null, cleanedText: text };
  const val = Number(normalizeDigits(match[1]));
  const cleanedText = text.slice(0, match.index).trim();
  return { marks: Number.isNaN(val) ? null : val, cleanedText: cleanedText || text };
}

// Check if line indicates a new question boundary
export function isQuestionHeader(line: string): { isHeader: boolean; number: string | null; title: string; marks: number | null } {
  const trimmed = line.trim();

  // Exclude option lines immediately
  if (/^[\(\[]?([A-Da-d]|[\u0995-\u0998])[\)\].:\-]/u.test(trimmed) || /^[A-Da-d\u0995-\u0998]\)\s+/u.test(trimmed)) {
    return { isHeader: false, number: null, title: "", marks: null };
  }

  // Stimulus / উদ্দীপক pattern without explicit number:
  if (/^(?:উদ্দীপক|দৃশ্যকল্প)\s*[:\-–—]/iu.test(trimmed) || /^(?:নিচের\s+উদ্দীপকটি|read\s+the\s+following\s+stem)/iu.test(trimmed)) {
    const { marks, cleanedText } = extractMarks(trimmed);
    return { isHeader: true, number: null, title: formatStemFormulas(cleanedText), marks };
  }

  // Question numbering formats:
  // ১. / ১। / ১) / (১) / প্রশ্ন ১: / প্রশ্ন-১: / Question 1: / Q1. / Q1: / 1. / 1) / (1)
  const qPattern = /^(?:(?:প্রশ্ন|question|q)\s*[\-:]?\s*)?([\p{N}\u09e6-\u09ef\d]+|[IVXLCDM]+)[\.\)।:\-–—\s]+(.+)/iu;
  const match = trimmed.match(qPattern);

  if (match) {
    const num = match[1];
    const text = match[2].trim();
    const { marks, cleanedText } = extractMarks(text);
    return { isHeader: true, number: num, title: formatStemFormulas(cleanedText), marks };
  }

  return { isHeader: false, number: null, title: "", marks: null };
}

export function parseQuestionsFallback(text: string): ParsedQuestion[] {
  const cleanedText = text
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\[[^\]\n]*\bpage\s*\d+[^\]\n]*\]/gi, "");

  const lines = cleanedText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const questions: ParsedQuestion[] = [];
  let current: ParsedQuestion | null = null;

  function finalizeQuestion() {
    if (!current) return;
    const isCq = Boolean(current.subQuestions && current.subQuestions.length > 0);
    const hasOptions = current.options.length >= 2;
    current.type = isCq ? "cq" : hasOptions ? "mcq" : "written";
    current.marks = isCq
      ? (current.subQuestions?.reduce((sum, sq) => sum + (sq.marks || 0), 0) || 10)
      : (current.marks !== null ? current.marks : (hasOptions ? 1 : 5));
    questions.push(current);
    current = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Answer indicator
    const optRes = extractOptionsFromLine(line);
    if (optRes.answerIndex !== null && current) {
      current.correct = optRes.answerIndex;
      continue;
    }

    // 2. Question header / boundary
    const headerRes = isQuestionHeader(line);
    if (headerRes.isHeader) {
      finalizeQuestion();
      current = {
        title: headerRes.title,
        subtitle: null,
        marks: headerRes.marks,
        options: [],
        correct: null,
        warnings: [],
        type: "unknown",
        number: headerRes.number,
        images: [],
        tables: [],
        subQuestions: []
      };
      continue;
    }

    // If no active question, check if this line might be a question without explicit number
    if (!current) {
      if (optRes.isOption) continue;
      const { marks, cleanedText } = extractMarks(line);
      current = {
        title: formatStemFormulas(cleanedText),
        subtitle: null,
        marks,
        options: [],
        correct: null,
        warnings: [],
        type: "unknown",
        number: null,
        images: [],
        tables: [],
        subQuestions: []
      };
      continue;
    }

    // Check if line specifies marks e.g. "Marks: 4" or "[5]"
    const lineMarks = extractMarks(line);
    if (lineMarks.marks !== null && current) {
      current.marks = lineMarks.marks;
      if (!lineMarks.cleanedText) continue;
    }

    // 3. Check for CQ sub-questions vs MCQ options
    const cqSub = extractCqSubQuestion(line);

    // Is the question marked as CQ or has stimulus markers?
    const isExplicitCq = /(?:উদ্দীপক|দৃশ্যকল্প|চিত্রটি|তথ্যের\s*আলোকে|stem|passage|scenario)/iu.test(current.title) ||
                         Boolean(current.subQuestions && current.subQuestions.length > 0);

    // If this line has explicit marks [1], [2], or CQ directive verbs, or question is explicitly a CQ:
    if (cqSub && (cqSub.hasExplicitMarks || isExplicitCq)) {
      if (!current.subQuestions) current.subQuestions = [];
      current.subQuestions.push({
        id: `sq_${current.subQuestions.length + 1}`,
        label: cqSub.label,
        text: cqSub.text,
        marks: cqSub.marks
      });
      continue;
    }

    // 4. MCQ options
    if (optRes.isOption && (!current.subQuestions || current.subQuestions.length === 0)) {
      current.options.push(...optRes.options);
      continue;
    }

    // 5. Continuation lines
    if (current.subQuestions && current.subQuestions.length > 0) {
      const lastSq = current.subQuestions[current.subQuestions.length - 1];
      lastSq.text = `${lastSq.text} ${formatStemFormulas(line)}`.trim();
    } else if (current.options.length === 0) {
      current.title = `${current.title}\n${formatStemFormulas(line)}`.trim();
    } else {
      // Append to last option if option text wrapped across lines
      const lastOptIdx = current.options.length - 1;
      current.options[lastOptIdx] = `${current.options[lastOptIdx]} ${formatStemFormulas(line)}`.trim();
    }
  }

  finalizeQuestion();
  return normalizeQuestions(questions);
}

function prepareQuestionText(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\[[^\]\n]*\bpage\s*\d+[^\]\n]*\]/gi, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+((?:q(?:uestion)?\s*)?[\p{N}\u09e6-\u09ef\u0660-\u0669\u06f0-\u06f9]+[.)।\-]\s+)/giu, "\n$1")
    .replace(/\s+((?:option\s*)?(?:\(?(?:[A-Ha-h]|[ivxlcdm]+|[\u0995-\u0998])[\).:\-]|(?:\([\p{N}\u09e6-\u09ef\u0660-\u0669\u06f0-\u06f9]+\)|[\p{N}\u09e6-\u09ef\u0660-\u0669\u06f0-\u06f9]+[.:\-])(?!\s*\]))\s+)/giu, "\n$1")
    .replace(/\s+((?:answer|correct(?:\s+answer)?|উত্তর|উত্তরঃ|সঠিক\s+উত্তর)\s*[:\-]?\s*)/giu, "\n$1")
    .trim();
}

function createQuestion(title: string, number: string | null): ParsedQuestion {
  return {
    title: title.trim(),
    subtitle: null,
    marks: null,
    options: [],
    correct: null,
    warnings: [],
    type: "unknown",
    number,
    images: [],
    tables: []
  };
}

function serializeQuestion(question: ParsedQuestion) {
  const prefix = question.number ? `${question.number}. ` : "";
  const options = question.options.map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`).join("\n");
  return [prefix + question.title, question.subtitle, options].filter(Boolean).join("\n");
}

function firstNumber(match: RegExpMatchArray | null) {
  if (!match) return null;
  const value = match.slice(1).find(Boolean);
  return value ? Number(toAsciiDigits(value)) : null;
}

function toAsciiDigits(value: string) {
  return value
    .replace(/[\u09e6-\u09ef]/g, (digit) => String(digit.charCodeAt(0) - 0x09e6))
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0));
}

function stripCodeFence(value: string) {
  return value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

function questionKey(question: ParsedQuestion) {
  return `${question.number ?? ""} ${question.title} ${question.options.join(" ")}`.toLowerCase();
}

function scoreQuestion(question: ParsedQuestion) {
  return question.title.length + question.options.join("").length + question.tables.length * 50 + question.images.length * 20 - question.warnings.length * 5;
}

function similarity(a: string, b: string) {
  const wordsA = new Set(a.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  if (!wordsA.size || !wordsB.size) return 0;
  const intersection = [...wordsA].filter((word) => wordsB.has(word)).length;
  return intersection / Math.max(wordsA.size, wordsB.size);
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<R>) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

function debug(message: string, payload: Record<string, unknown>) {
  if (env.NODE_ENV !== "production" && env.PARSER_DEBUG) console.debug(message, payload);
}
