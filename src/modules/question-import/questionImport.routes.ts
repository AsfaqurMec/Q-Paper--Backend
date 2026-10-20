import { Router } from "express";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import Tesseract from "tesseract.js";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { ApiError, asyncHandler, ok, validate } from "../../utils/http.js";
import type { ExtractedPage } from "./questionImport.chunker.js";
import { parseMultimodalDocument, parseQuestionDocument } from "./questionImport.parser.js";
import type { ParsedQuestion } from "./questionImport.schema.js";

type ImportType = "image" | "pdf" | "docx";

const parseSchema = z.object({
  importType: z.enum(["image", "pdf", "docx"]),
  files: z
    .array(
      z.object({
        name: z.string().min(1),
        mimeType: z.string().optional(),
        dataUrl: z.string().startsWith("data:")
      })
    )
    .min(1)
    .max(10)
});

export const questionImportRouter = Router();

questionImportRouter.use(requireAuth);

questionImportRouter.post(
  "/parse",
  validate(parseSchema),
  asyncHandler(async (req, res) => {
    if (req.user?.plan !== "ultra" && req.user?.role !== "admin") {
      throw new ApiError(403, "The Question Import feature is only available in the Ultra package. Please upgrade to Ultra.");
    }

    const started = Date.now();
    const input = req.body as z.infer<typeof parseSchema>;

    let extractionPages: ExtractedPage[] = [];
    const inheritedWarnings: string[] = [];

    // For DOCX and PDF text fallback extraction
    if (input.importType === "docx" || input.importType === "pdf") {
      try {
        const extraction = await extractFiles(input.importType, input.files);
        extractionPages = extraction.pages;
        inheritedWarnings.push(...extraction.warnings);
      } catch (extractErr) {
        console.warn(`[QuestionImport] Text extraction error for ${input.importType}:`, extractErr);
      }
    }

    let parsed = await parseMultimodalDocument(input.importType, input.files, extractionPages);

    // If 0 questions were parsed and importType was "image", run local Tesseract OCR fallback
    if (parsed.questions.length === 0 && input.importType === "image") {
      console.log("[QuestionImport] Image had 0 questions from Gemini, invoking Tesseract OCR fallback...");
      try {
        const ocrPages: ExtractedPage[] = [];
        for (const file of input.files) {
          const buffer = dataUrlToBuffer(file.dataUrl);
          let ocrText = "";
          try {
            const res = await Tesseract.recognize(buffer, "ben+eng");
            ocrText = res.data.text;
          } catch {
            const res = await Tesseract.recognize(buffer, "eng");
            ocrText = res.data.text;
          }
          if (ocrText && ocrText.trim()) {
            ocrPages.push({ pageNumber: ocrPages.length + 1, sourceName: file.name, text: ocrText.trim() });
          }
        }
        if (ocrPages.length > 0) {
          extractionPages = ocrPages;
          parsed = await parseQuestionDocument(ocrPages, [
            ...parsed.warnings,
            "Document questions were extracted using on-device OCR fallback."
          ]);
        }
      } catch (ocrErr) {
        console.warn("[QuestionImport] Tesseract OCR fallback error:", ocrErr);
      }
    }

    return ok(
      res,
      {
        importType: input.importType,
        extractedText: extractionPages.map((page) => page.text).join("\n\n").trim(),
        warnings: Array.from(new Set([...inheritedWarnings, ...parsed.warnings])),
        metrics: {
          ...parsed.metrics,
          totalTimeMs: Date.now() - started
        },
        questions: parsed.questions.map(toClientQuestion)
      },
      "Questions parsed"
    );
  })
);

async function extractFiles(importType: ImportType, files: Array<{ name: string; dataUrl: string }>) {
  const pages: ExtractedPage[] = [];
  const warnings: string[] = [];

  for (const file of files) {
    const buffer = dataUrlToBuffer(file.dataUrl);

    if (importType === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      pages.push({ pageNumber: pages.length + 1, sourceName: file.name, text: result.value });
      warnings.push(...result.messages.map((message) => `${file.name}: ${message.message}`));
    }

    if (importType === "pdf") {
      const extracted = await extractPdfPages(file.name, buffer);
      pages.push(...extracted.pages.map((page) => ({ ...page, pageNumber: pages.length + page.pageNumber })));
      warnings.push(...extracted.warnings);
    }

  }

  return { pages: pages.filter((page) => page.text.trim()), warnings };
}

async function extractPdfPages(sourceName: string, buffer: Buffer) {
  const warnings: string[] = [];
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const textPages = result.pages
      .map((page) => ({ pageNumber: page.num, sourceName, text: page.text }))
      .filter((page) => page.text.trim());

    return { pages: textPages, warnings };
  } catch (error) {
    warnings.push(`${sourceName}: PDF extraction failed${error instanceof Error ? ` (${error.message})` : ""}`);
    return { pages: [] as ExtractedPage[], warnings };
  } finally {
    await parser.destroy();
  }
}

function toClientQuestion(question: ParsedQuestion, index: number) {
  const options = question.options.map((option) => String(option).trim()).filter(Boolean);
  const warnings = [...question.warnings];
  const isCq = question.type === "cq" || (question.subQuestions && question.subQuestions.length > 0);
  const isWritten = !isCq && (question.type === "written" || options.length === 0);
  if (!isCq && !isWritten && options.length < 2) warnings.push("MCQ has fewer than two options");
  if (!question.number) warnings.push("Question numbering is unclear");

  const subQuestions = question.subQuestions?.map((sq, sqIdx) => ({
    id: sq.id || `sq_${index}_${sqIdx + 1}`,
    label: sq.label || (sqIdx === 0 ? "ক" : sqIdx === 1 ? "খ" : sqIdx === 2 ? "গ" : "ঘ"),
    text: sq.text,
    marks: Number(sq.marks || (sqIdx === 0 ? 1 : sqIdx === 1 ? 2 : sqIdx === 2 ? 3 : 4)),
    answer: sq.answer || "",
    explanation: sq.explanation || ""
  }));

  const totalMarks = isCq && subQuestions?.length
    ? subQuestions.reduce((sum, sq) => sum + (sq.marks || 0), 0)
    : Number(question.marks ?? (isCq ? 10 : isWritten ? 5 : 1));

  return {
    id: `import_${Date.now()}_${index}_${Math.random().toString(16).slice(2)}`,
    title: question.title,
    subtitle: question.subtitle ?? "",
    imageUrl: question.images[0] ?? "",
    marks: totalMarks,
    options,
    correct: question.correct,
    explanation: question.explanation ?? "",
    warnings: Array.from(new Set(warnings)),
    type: isCq ? "cq" : isWritten ? "written" : "mcq",
    number: question.number,
    images: question.images,
    tables: question.tables,
    subQuestions
  };
}

function dataUrlToBuffer(dataUrl: string) {
  const [, base64 = ""] = dataUrl.split(",");
  return Buffer.from(base64, "base64");
}
