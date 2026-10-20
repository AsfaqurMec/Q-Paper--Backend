import { nanoid } from "nanoid";
import { QuestionBankItemModel, type BankSubQuestion, type QuestionBankItemRecord } from "./questionBank.models.js";
import { resolveCurriculumMetadata } from "../curriculum/curriculum.service.js";
import { AcademicClassModel, SubjectModel, ChapterModel } from "../curriculum/curriculum.models.js";

export type ImportMode = "skip_duplicates" | "update_existing" | "append";

export interface ImportQuestionsOptions {
  ownerId?: string;
  classId?: string;
  subjectId?: string;
  chapterId?: string;
  className?: string;
  subject?: string;
  chapter?: string;
  defaultClassName?: string;
  defaultSubject?: string;
  defaultChapter?: string;
  defaultBoard?: string;
  defaultYear?: string;
  defaultDifficulty?: "easy" | "medium" | "hard";
  defaultNature?: "theory" | "mathematical";
  mode?: ImportMode;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

export interface QuestionImportResult {
  totalReceived: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ index: number; title?: string; error: string }>;
  sampleInserted: Array<{ id: string; title: string; type: string; subject: string; className: string }>;
}

/**
 * Normalizes raw input from various JSON structures (array, wrapper object, single object).
 */
export function extractQuestionsFromPayload(payload: unknown): {
  rawQuestions: any[];
  wrapperDefaults: Partial<ImportQuestionsOptions>;
} {
  if (!payload) return { rawQuestions: [], wrapperDefaults: {} };

  // If input is a string, try parsing it as JSON
  let data: any = payload;
  if (typeof payload === "string") {
    try {
      data = JSON.parse(payload);
    } catch (err: any) {
      throw new Error(`Invalid JSON syntax: ${err.message}`);
    }
  }

  // 1. If payload is directly an array
  if (Array.isArray(data)) {
    return { rawQuestions: data, wrapperDefaults: {} };
  }

  // 2. If payload is an object containing a 'questions' or 'items' or 'data' array
  if (typeof data === "object" && data !== null) {
    const list = data.questions || data.items || data.data;
    if (Array.isArray(list)) {
      const wrapperDefaults: Partial<ImportQuestionsOptions> = {
        classId: data.classId,
        subjectId: data.subjectId,
        chapterId: data.chapterId,
        className: data.className || data.class || data.grade,
        subject: data.subject || data.subjectName || data.category,
        chapter: data.chapter || data.chapterName,
        defaultClassName: data.className || data.class || data.grade,
        defaultSubject: data.subject || data.subjectName || data.category,
        defaultChapter: data.chapter || data.chapterName,
        defaultBoard: data.board || data.boardName,
        defaultYear: data.year ? String(data.year) : undefined,
        defaultDifficulty: data.difficulty,
        defaultNature: data.nature,
        mode: data.mode
      };
      return { rawQuestions: list, wrapperDefaults };
    }

    // 3. If payload is a single question object
    if (data.title || data.question || data.stem || data.text) {
      return { rawQuestions: [data], wrapperDefaults: {} };
    }
  }

  return { rawQuestions: [], wrapperDefaults: {} };
}

/**
 * Normalize options into string[]
 */
function normalizeOptions(rawOptions: any): string[] {
  if (!rawOptions) return [];

  if (Array.isArray(rawOptions)) {
    return rawOptions.map((opt: any) => {
      if (typeof opt === "string") return opt.trim();
      if (typeof opt === "number") return String(opt);
      if (typeof opt === "object" && opt !== null) {
        return (opt.text || opt.title || opt.value || opt.option || "").toString().trim();
      }
      return "";
    }).filter((opt: string) => opt.length > 0);
  }

  if (typeof rawOptions === "object" && rawOptions !== null) {
    // e.g. { A: "First", B: "Second", C: "Third", D: "Fourth" }
    const keys = Object.keys(rawOptions).sort();
    return keys.map((k) => String(rawOptions[k]).trim()).filter((opt) => opt.length > 0);
  }

  return [];
}

/**
 * Normalizes correctIndex from various forms (letters 'A'-'D', Bengali 'ক'-'ঘ', numbers, or text matches)
 */
function normalizeCorrectIndex(rawCorrect: any, options: string[], rawOptionsArray?: any[]): number {
  if (rawCorrect === undefined || rawCorrect === null) {
    // If rawOptions was an array of objects with isCorrect: true
    if (Array.isArray(rawOptionsArray)) {
      const foundIdx = rawOptionsArray.findIndex((o) => o && (o.isCorrect === true || o.correct === true));
      if (foundIdx >= 0) return foundIdx;
    }
    return 0;
  }

  if (typeof rawCorrect === "number") {
    // If 1-indexed (e.g., options has 4 items and rawCorrect is 4)
    if (rawCorrect >= 1 && rawCorrect <= options.length && !options[rawCorrect]) {
      return rawCorrect - 1;
    }
    if (rawCorrect >= 0 && rawCorrect < options.length) {
      return rawCorrect;
    }
    return 0;
  }

  const str = String(rawCorrect).trim();

  // English letters
  const upper = str.toUpperCase();
  const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5 };
  if (letterMap[upper] !== undefined && letterMap[upper] < options.length) {
    return letterMap[upper];
  }

  // Bengali letters
  const bnMap: Record<string, number> = { "ক": 0, "খ": 1, "গ": 2, "ঘ": 3, "ঙ": 4 };
  if (bnMap[str] !== undefined && bnMap[str] < options.length) {
    return bnMap[str];
  }

  // Numeric string "0", "1", etc.
  const parsedNum = parseInt(str, 10);
  if (!isNaN(parsedNum)) {
    if (parsedNum >= 1 && parsedNum <= options.length && !options[parsedNum]) {
      return parsedNum - 1;
    }
    if (parsedNum >= 0 && parsedNum < options.length) {
      return parsedNum;
    }
  }

  // Exact text match
  const textIdx = options.findIndex((opt) => opt.toLowerCase() === str.toLowerCase());
  if (textIdx >= 0) return textIdx;

  return 0;
}

/**
 * Normalizes sub-questions for Creative Questions (CQ)
 */
function normalizeSubQuestions(rawSub: any): BankSubQuestion[] | undefined {
  if (!rawSub || !Array.isArray(rawSub) || rawSub.length === 0) return undefined;

  const bnLabels = ["ক", "খ", "গ", "ঘ"];
  const defaultMarks = [1, 2, 3, 4];

  return rawSub.map((item: any, idx: number) => {
    const label = item.label || bnLabels[idx] || String.fromCharCode(97 + idx);
    const text = item.text || item.question || item.title || "";
    const marks = Number(item.marks) || defaultMarks[idx] || 1;
    const answer = item.answer || item.solution || item.explanation;
    const explanation = item.explanation;

    return {
      id: item.id || `sub_${nanoid(8)}`,
      label,
      text: String(text).trim(),
      marks,
      answer: answer ? String(answer).trim() : undefined,
      explanation: explanation ? String(explanation).trim() : undefined
    };
  }).filter((sq: BankSubQuestion) => sq.text.length > 0);
}

/**
 * Normalizes difficulty
 */
function normalizeDifficulty(val: any, fallback = "medium"): "easy" | "medium" | "hard" {
  if (!val) return fallback as "easy" | "medium" | "hard";
  const s = String(val).toLowerCase().trim();
  if (s === "easy" || s === "সহজ") return "easy";
  if (s === "hard" || s === "কঠিন") return "hard";
  return "medium";
}

/**
 * Normalizes nature
 */
function normalizeNature(val: any, fallback = "theory"): "theory" | "mathematical" {
  if (!val) return fallback as "theory" | "mathematical";
  const s = String(val).toLowerCase().trim();
  if (s === "mathematical" || s === "math" || s === "গাণিতিক") return "mathematical";
  return "theory";
}

/**
 * Main import runner for JSON question data
 */
export async function importQuestionsFromJson(
  payload: unknown,
  options: ImportQuestionsOptions = {}
): Promise<QuestionImportResult> {
  const { rawQuestions, wrapperDefaults } = extractQuestionsFromPayload(payload);

  const effectiveOptions: ImportQuestionsOptions = {
    ...wrapperDefaults,
    ...options
  };

  const mode: ImportMode =
    effectiveOptions.mode ||
    (effectiveOptions.updateExisting ? "update_existing" : effectiveOptions.skipDuplicates !== false ? "skip_duplicates" : "append");

  const ownerId = effectiveOptions.ownerId || "system";
  const timestamp = new Date().toISOString();

  // Selected Class, Subject, Chapter from options
  const batchClassId = effectiveOptions.classId;
  const batchSubjectId = effectiveOptions.subjectId;
  const batchChapterId = effectiveOptions.chapterId;
  const batchClassName = effectiveOptions.className || effectiveOptions.defaultClassName;
  const batchSubject = effectiveOptions.subject || effectiveOptions.defaultSubject;
  const batchChapter = effectiveOptions.chapter || effectiveOptions.defaultChapter;

  // Pre-resolve batch-level curriculum taxonomy once
  let batchResolved: {
    classId?: string;
    subjectId?: string;
    chapterId?: string;
    className?: string;
    subject?: string;
    chapter?: string;
  } = {};

  if (batchClassId || batchClassName || batchSubjectId || batchSubject || batchChapterId || batchChapter) {
    batchResolved = await resolveCurriculumMetadata({
      classId: batchClassId,
      className: batchClassName,
      subjectId: batchSubjectId,
      subject: batchSubject,
      chapterId: batchChapterId,
      chapter: batchChapter
    });
  }

  const result: QuestionImportResult = {
    totalReceived: rawQuestions.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    sampleInserted: []
  };

  for (let i = 0; i < rawQuestions.length; i++) {
    const raw = rawQuestions[i];
    try {
      if (!raw || typeof raw !== "object") {
        result.errors.push({ index: i, error: "Question item must be a JSON object" });
        continue;
      }

      // Title/Stem extraction
      const title = String(raw.title || raw.question || raw.stem || raw.text || raw.questionText || "").trim();
      if (!title) {
        result.errors.push({ index: i, error: "Missing required 'title' or 'question' text" });
        continue;
      }

      // SubQuestions
      const subQuestions = normalizeSubQuestions(raw.subQuestions || raw.parts || raw.sub_questions);

      // Options
      const optionsList = normalizeOptions(raw.options || raw.choices || raw.answers);

      // Determine type
      let type: "mcq" | "cq" | "both" = "mcq";
      const rawType = String(raw.type || "").toLowerCase().trim();
      if (rawType === "mcq" || rawType === "cq" || rawType === "both") {
        type = rawType as "mcq" | "cq" | "both";
      } else if (subQuestions && subQuestions.length > 0) {
        type = "cq";
      } else if (optionsList.length >= 2) {
        type = "mcq";
      }

      // MCQ Option Validation
      if (type === "mcq" && optionsList.length < 2) {
        result.errors.push({ index: i, title, error: "MCQ questions must have at least 2 options" });
        continue;
      }

      const correctIndex = type === "mcq" ? normalizeCorrectIndex(raw.correctIndex ?? raw.correct ?? raw.answer ?? raw.correctAnswer ?? raw.correctOption, optionsList, Array.isArray(raw.options) ? raw.options : undefined) : 0;

      // Marks calculation
      let marks = Number(raw.marks);
      if (!marks || isNaN(marks) || marks <= 0) {
        if (type === "cq") {
          marks = subQuestions ? subQuestions.reduce((sum, sq) => sum + sq.marks, 0) : 10;
        } else {
          marks = 1;
        }
      }

      // Class, Subject, Chapter
      const className = String(
        raw.className ||
        raw.class ||
        raw.grade ||
        batchResolved.className ||
        batchClassName ||
        "SSC (Class 9-10)"
      ).trim();

      const subject = String(
        raw.subject ||
        raw.subjectName ||
        raw.category ||
        batchResolved.subject ||
        batchSubject ||
        "General"
      ).trim();

      const chapter = String(
        raw.chapter ||
        raw.chapterName ||
        batchResolved.chapter ||
        batchChapter ||
        "General"
      ).trim();

      const category = String(raw.category || subject || "General").trim();

      // Resolve Curriculum Metadata
      let resolved: {
        classId?: string;
        subjectId?: string;
        chapterId?: string;
        className?: string;
        subject?: string;
        chapter?: string;
      };

      const hasItemCurriculum = Boolean(
        raw.classId || raw.className || raw.class ||
        raw.subjectId || raw.subject || raw.subjectName ||
        raw.chapterId || raw.chapter || raw.chapterName
      );

      if (!hasItemCurriculum && batchResolved.classId && batchResolved.subjectId && batchResolved.chapterId) {
        resolved = { ...batchResolved };
      } else {
        resolved = await resolveCurriculumMetadata({
          classId: raw.classId || batchResolved.classId || batchClassId,
          subjectId: raw.subjectId || batchResolved.subjectId || batchSubjectId,
          chapterId: raw.chapterId || batchResolved.chapterId || batchChapterId,
          className,
          subject,
          chapter
        });
      }

      // Ensure classId, subjectId, chapterId are non-empty for database schema requirements
      if (!resolved.classId) {
        const defaultCls = await AcademicClassModel.findOne({ status: "active" }).sort({ order: 1 }).lean();
        if (defaultCls) {
          resolved.classId = defaultCls.id;
          resolved.className = defaultCls.name;
        }
      }
      if (!resolved.subjectId && resolved.classId) {
        let subj = await SubjectModel.findOne({ classId: resolved.classId, status: "active" }).lean();
        if (!subj) {
          subj = await SubjectModel.findOne({ status: "active" }).lean();
        }
        if (subj) {
          resolved.subjectId = subj.id;
          resolved.subject = subj.name;
        }
      }
      if (!resolved.chapterId && resolved.subjectId && resolved.classId) {
        let chap = await ChapterModel.findOne({ subjectId: resolved.subjectId, status: "active" }).lean();
        if (chap) {
          resolved.chapterId = chap.id;
          resolved.chapter = chap.name;
        } else {
          const newCh = await ChapterModel.create({
            id: `ch_${nanoid(8)}`,
            classId: resolved.classId,
            subjectId: resolved.subjectId,
            chapterNumber: 1,
            name: chapter || "সাধারণ অধ্যায়",
            order: 1,
            status: "active",
            createdAt: timestamp,
            updatedAt: timestamp
          });
          resolved.chapterId = newCh.id;
          resolved.chapter = newCh.name;
        }
      }

      // Tags normalization
      let tags: string[] = [];
      if (Array.isArray(raw.tags)) {
        tags = raw.tags.map((t: any) => String(t).trim()).filter(Boolean);
      } else if (typeof raw.tags === "string" && raw.tags.trim()) {
        tags = raw.tags.split(",").map((t: string) => t.trim()).filter(Boolean);
      }

      const difficulty = normalizeDifficulty(raw.difficulty || effectiveOptions.defaultDifficulty, "medium");
      const nature = normalizeNature(raw.nature || effectiveOptions.defaultNature, "theory");
      const board = raw.board || raw.boardName || effectiveOptions.defaultBoard || undefined;
      const year = raw.year ? String(raw.year).trim() : effectiveOptions.defaultYear || undefined;
      const subtitle = raw.subtitle ? String(raw.subtitle).trim() : undefined;
      const imageUrl = raw.imageUrl || raw.image || undefined;
      const explanation = raw.explanation || raw.solution || raw.hint || undefined;

      // Duplicate Check
      // We check if a question with same title, subject, and class exists
      const duplicateFilter: any = {
        title: { $regex: new RegExp(`^${escapeRegex(title)}$`, "i") }
      };

      if (resolved.subjectId) {
        duplicateFilter.subjectId = resolved.subjectId;
      } else {
        duplicateFilter.subject = { $regex: new RegExp(`^${escapeRegex(resolved.subject || subject)}$`, "i") };
      }

      if (resolved.classId) {
        duplicateFilter.classId = resolved.classId;
      }

      const existing = await QuestionBankItemModel.findOne(duplicateFilter);

      if (existing) {
        if (mode === "skip_duplicates") {
          result.skipped++;
          continue;
        }

        if (mode === "update_existing") {
          // Update existing item
          existing.type = type;
          existing.nature = nature;
          existing.difficulty = difficulty;
          existing.marks = marks;
          existing.options = type === "mcq" ? optionsList : [];
          existing.correctIndex = correctIndex;
          existing.subQuestions = type === "cq" ? subQuestions : undefined;
          if (explanation) existing.explanation = explanation;
          if (subtitle) existing.subtitle = subtitle;
          if (imageUrl) existing.imageUrl = imageUrl;
          if (board) existing.board = board;
          if (year) existing.year = year;
          if (tags.length > 0) {
            existing.tags = Array.from(new Set([...(existing.tags || []), ...tags]));
          }
          if (resolved.classId) existing.classId = resolved.classId;
          if (resolved.subjectId) existing.subjectId = resolved.subjectId;
          if (resolved.chapterId) existing.chapterId = resolved.chapterId;
          existing.className = resolved.className || className;
          existing.subject = resolved.subject || subject;
          existing.chapter = resolved.chapter || chapter;
          existing.category = category;
          existing.updatedAt = timestamp;

          await existing.save();
          result.updated++;
          continue;
        }
        // If mode === "append", we continue and create a new record below
      }

      // Create new record
      const id = raw.id && typeof raw.id === "string" && !raw.id.startsWith("temp_") ? raw.id : `bank_${nanoid(10)}`;

      const record: Partial<QuestionBankItemRecord> = {
        id,
        ownerId: raw.ownerId || ownerId,
        classId: resolved.classId || raw.classId,
        subjectId: resolved.subjectId || raw.subjectId,
        chapterId: resolved.chapterId || raw.chapterId,
        className: resolved.className || className,
        subject: resolved.subject || subject,
        chapter: resolved.chapter || chapter,
        category,
        type,
        nature,
        difficulty,
        board,
        year,
        title,
        subtitle,
        imageUrl,
        marks,
        options: type === "mcq" ? optionsList : [],
        correctIndex,
        subQuestions: type === "cq" ? subQuestions : undefined,
        explanation,
        tags,
        usageCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      await QuestionBankItemModel.create(record);
      result.inserted++;

      if (result.sampleInserted.length < 5) {
        result.sampleInserted.push({
          id,
          title: title.length > 60 ? `${title.slice(0, 57)}...` : title,
          type,
          subject: record.subject!,
          className: record.className!
        });
      }
    } catch (itemErr: any) {
      result.errors.push({
        index: i,
        title: rawQuestions[i]?.title,
        error: itemErr.message || "Failed to process question"
      });
    }
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
