import { Router } from "express";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { z } from "zod";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { ApiError, asyncHandler, ok, validate } from "../../utils/http.js";
import { getPlan } from "../plans/plan.service.js";
import { createPaper, updatePaperQuestions } from "../papers/paper.service.js";
import { QuestionBankItemModel, type QuestionBankItemRecord } from "./questionBank.models.js";
import { getCurriculumTree, resolveCurriculumMetadata, enrichQuestionsWithCurriculum } from "../curriculum/curriculum.service.js";
import { importQuestionsFromJson } from "./questionBank.importer.js";

const DEFAULT_CATEGORIES = [
  "পদার্থবিজ্ঞান",
  "পদার্থবিজ্ঞান ১ম পত্র",
  "পদার্থবিজ্ঞান ২য় পত্র",
  "রসায়ন",
  "রসায়ন ১ম পত্র",
  "রসায়ন ২য় পত্র",
  "জীববিজ্ঞান",
  "জীববিজ্ঞান ১ম পত্র (উদ্ভিদবিজ্ঞান)",
  "জীববিজ্ঞান ২য় পত্র (প্রাণিবিজ্ঞান)",
  "সাধারণ গণিত",
  "উচ্চতর গণিত",
  "উচ্চতর গণিত ১ম পত্র",
  "উচ্চতর গণিত ২য় পত্র",
  "তথ্য ও যোগাযোগ প্রযুক্তি",
  "বাংলা ১ম পত্র",
  "বাংলা ২য় পত্র",
  "বাংলাদেশ ও বিশ্বপরিচয়",
  "সাধারণ বিজ্ঞান"
];

// ─── Bengali ↔ English alias maps ────────────────────────────────────────────
// Canonical English class names and their Bengali aliases stored in the DB
const CLASS_ALIASES: Record<string, string[]> = {
  "SSC (Class 9-10)":   ["নবম-দশম শ্রেণি (SSC)", "SSC (Class 9-10)", "Class 9-10", "SSC"],
  "HSC (Class 11-12)":  ["একাদশ-দ্বাদশ শ্রেণি (HSC)", "HSC (Class 11-12)", "Class 11-12", "HSC"],
};

// Canonical English subject names and their Bengali aliases stored in the DB
const SUBJECT_ALIASES: Record<string, string[]> = {
  "Physics":                    ["পদার্থবিজ্ঞান", "Physics"],
  "Physics 1st Paper":          ["পদার্থবিজ্ঞান ১ম পত্র", "Physics 1st Paper"],
  "Physics 2nd Paper":          ["পদার্থবিজ্ঞান ২য় পত্র", "Physics 2nd Paper"],
  "Chemistry":                  ["রসায়ন", "Chemistry"],
  "Chemistry 1st Paper":        ["রসায়ন ১ম পত্র", "Chemistry 1st Paper"],
  "Chemistry 2nd Paper":        ["রসায়ন ২য় পত্র", "Chemistry 2nd Paper"],
  "Biology":                    ["জীববিজ্ঞান", "Biology"],
  "Biology 1st Paper (Botany)": ["জীববিজ্ঞান ১ম পত্র (উদ্ভিদবিজ্ঞান)", "Biology 1st Paper (Botany)", "Botany"],
  "Biology 2nd Paper (Zoology)":["জীববিজ্ঞান ২য় পত্র (প্রাণিবিজ্ঞান)", "Biology 2nd Paper (Zoology)", "Zoology"],
  "Higher Mathematics":         ["উচ্চতর গণিত", "Higher Mathematics"],
  "Higher Mathematics 1st Paper":["উচ্চতর গণিত ১ম পত্র", "Higher Mathematics 1st Paper"],
  "Higher Mathematics 2nd Paper":["উচ্চতর গণিত ২য় পত্র", "Higher Mathematics 2nd Paper"],
  "General Mathematics":        ["সাধারণ গণিত", "General Mathematics"],
  "General Science":            ["সাধারণ বিজ্ঞান", "বিজ্ঞান", "General Science", "Science"],
  "ICT":                        ["তথ্য ও যোগাযোগ প্রযুক্তি", "ICT"],
  "Bangla 1st Paper":           ["বাংলা ১ম পত্র", "Bangla 1st Paper"],
  "Bangla 2nd Paper":           ["বাংলা ২য় পত্র", "Bangla 2nd Paper"],
  "English 1st Paper":          ["English 1st Paper"],
  "English 2nd Paper":          ["English 2nd Paper"],
  "Bangladesh & World Introduction": ["বাংলাদেশ ও বিশ্বপরিচয়", "Bangladesh & World Introduction"],
};

// Reverse lookup: any alias → canonical English name
const CLASS_CANONICAL: Record<string, string> = {};
for (const [canonical, aliases] of Object.entries(CLASS_ALIASES)) {
  for (const alias of aliases) CLASS_CANONICAL[alias.toLowerCase()] = canonical;
}
const SUBJECT_CANONICAL: Record<string, string> = {};
for (const [canonical, aliases] of Object.entries(SUBJECT_ALIASES)) {
  for (const alias of aliases) SUBJECT_CANONICAL[alias.toLowerCase()] = canonical;
}

/**
 * Returns the canonical English class name for any stored variant.
 * Falls back to the original if not found.
 */
function canonicalClass(name: string): string {
  return CLASS_CANONICAL[name.toLowerCase()] ?? name;
}

/**
 * Returns the canonical English subject name for any stored variant.
 * Falls back to the original if not found.
 */
function canonicalSubject(name: string): string {
  return SUBJECT_CANONICAL[name.toLowerCase()] ?? name;
}

/**
 * Build a MongoDB $or condition that matches a field against all known aliases
 * for the given canonical name (both English and Bengali variants).
 */
function buildSubjectCondition(canonical: string): Record<string, any> {
  const aliases = SUBJECT_ALIASES[canonical];
  if (!aliases || aliases.length === 0) {
    // Unknown subject — fall back to exact match
    return {
      $or: [
        { subject: { $regex: new RegExp(`^${escapeRegex(canonical)}$`, "i") } },
        { category: { $regex: new RegExp(`^${escapeRegex(canonical)}$`, "i") } }
      ]
    };
  }
  const patterns = aliases.map((a) => new RegExp(`^${escapeRegex(a)}$`, "i"));
  return {
    $or: [
      { subject: { $in: patterns } },
      { category: { $in: patterns } }
    ]
  };
}

/**
 * Build a MongoDB condition that matches className against all known aliases
 * for the given canonical class name.
 */
function buildClassCondition(canonical: string): Record<string, any> {
  const aliases = CLASS_ALIASES[canonical];
  if (!aliases || aliases.length === 0) {
    return { className: { $regex: new RegExp(`^${escapeRegex(canonical)}$`, "i") } };
  }
  const patterns = aliases.map((a) => new RegExp(`^${escapeRegex(a)}$`, "i"));
  return { className: { $in: patterns } };
}
// ─────────────────────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractChapterNumber(name: string): number {
  if (!name) return 9999;
  const bnMap: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9"
  };
  const converted = name.replace(/[০-৯]/g, (d) => bnMap[d] || d);
  const match = converted.match(/(?:অধ্যায়|অধ্যায়|Chapter|Ch\.?)\s*(\d+)/i) || converted.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 9999;
}

const bankSubQuestionSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  text: z.string().min(1),
  marks: z.number().int().min(1).max(20),
  answer: z.string().optional(),
  explanation: z.string().optional()
});

const bankQuestionSchema = z
  .object({
    classId: z.string().optional(),
    subjectId: z.string().optional(),
    chapterId: z.string().optional(),
    className: z.string().optional(),
    subject: z.string().optional(),
    chapter: z.string().optional(),
    category: z.string().min(1).optional(),
    type: z.enum(["mcq", "cq"]).default("mcq"),
    nature: z.enum(["theory", "mathematical"]).default("theory"),
    difficulty: z.enum(["easy", "medium", "hard"]),
    title: z.string().min(1, "Question title or stem is required"),
    subtitle: z.string().optional(),
    imageUrl: z.string().optional(),
    marks: z.number().int().min(1).max(100).default(1),
    options: z.array(z.string()).default([]),
    correctIndex: z.number().int().min(0).default(0),
    subQuestions: z.array(bankSubQuestionSchema).optional(),
    explanation: z.string().optional(),
    board: z.string().optional(),
    year: z.string().optional(),
    tags: z.array(z.string()).optional()
  })
  .refine(
    (data) => {
      if (data.type === "mcq") {
        return data.options && data.options.length >= 2;
      }
      return true;
    },
    { message: "At least 2 options are required for MCQ questions", path: ["options"] }
  );

const updateBankQuestionSchema = z.object({
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  chapterId: z.string().optional(),
  className: z.string().optional(),
  subject: z.string().optional(),
  chapter: z.string().optional(),
  category: z.string().min(1).optional(),
  type: z.enum(["mcq", "cq"]).optional(),
  nature: z.enum(["theory", "mathematical"]).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  board: z.string().optional(),
  year: z.string().optional(),
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  imageUrl: z.string().optional(),
  marks: z.number().int().min(1).max(100).optional(),
  options: z.array(z.string()).optional(),
  correctIndex: z.number().int().min(0).optional(),
  subQuestions: z.array(bankSubQuestionSchema).optional(),
  explanation: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const batchBankQuestionSchema = z.object({
  questions: z.array(bankQuestionSchema).min(1, "At least one question required")
});

const randomSchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  count: z.number().int().min(1).max(50).default(10)
});

const randomPaperSchema = z.object({
  name: z.string().min(1, "Paper name is required"),
  category: z.string().min(1, "Category is required"),
  className: z.string().min(1).default("Class 10"),
  examType: z.string().min(1).default("Model Test"),
  duration: z.string().min(1).default("30 minutes"),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  count: z.number().int().min(1).max(50).default(10),
  layout: z.enum(["single", "split"]).default("split"),
  instructions: z.string().optional()
});

const generatePaperSchema = z
  .object({
    name: z.string().min(1, "Paper name is required"),
    classId: z.string().optional(),
    subjectId: z.string().optional(),
    chapterId: z.string().optional(),
    className: z.string().optional().default("SSC (Class 9-10)"),
    subject: z.string().optional().default("General"),
    chapter: z.string().optional().default("all"),
    type: z.enum(["mcq", "cq", "both"]).default("both"),
    mcqCount: z.number().int().min(0).max(100).default(0),
    mcqTheoryCount: z.number().int().min(0).max(100).optional(),
    mcqMathCount: z.number().int().min(0).max(100).optional(),
    cqCount: z.number().int().min(0).max(30).default(0),
    cqTheoryCount: z.number().int().min(0).max(30).optional(),
    cqMathCount: z.number().int().min(0).max(30).optional(),
    difficulty: z.enum(["easy", "medium", "hard", "all"]).default("all"),
    examType: z.string().min(1).default("Model Test"),
    duration: z.string().min(1).default("45 minutes"),
    layout: z.enum(["single", "split"]).default("split"),
    questionsPerPage: z.number().int().min(0).max(50).default(10).optional(),
    instructions: z.string().optional(),
    mcqSectionTitle: z.string().max(120).optional(),
    cqSectionTitle: z.string().max(120).optional(),
    tag: z.string().optional(),
    board: z.string().optional(),
    year: z.string().optional(),
    boardOnly: z.boolean().optional()
  })
  .refine(
    (data) => {
      if (data.type === "mcq") return data.mcqCount > 0;
      if (data.type === "cq") return data.cqCount > 0;
      if (data.type === "both") return data.mcqCount > 0 || data.cqCount > 0;
      return true;
    },
    { message: "Please specify a question amount greater than 0", path: ["mcqCount"] }
  );

const createPaperFromSelectedSchema = z.object({
  bankQuestionIds: z.array(z.string()).min(1, "At least one question must be selected"),
  name: z.string().min(1, "Paper name is required"),
  className: z.string().min(1, "Class is required"),
  subject: z.string().min(1, "Subject is required"),
  examType: z.string().min(1).default("Model Test"),
  duration: z.string().min(1).default("45 minutes"),
  totalMarks: z.number().int().min(1).optional(),
  layout: z.enum(["single", "split"]).default("split"),
  cqLayout: z.enum(["single", "split"]).default("split").optional(),
  questionsPerPage: z.number().int().min(0).max(50).default(10).optional(),
  questionNumberStyle: z.enum(["numeric", "bangla", "upper-alpha", "lower-alpha", "roman"]).default("numeric").optional(),
  optionLabelStyle: z.enum(["bangla", "upper-alpha", "lower-alpha", "numeric"]).default("bangla").optional(),
  instructions: z.string().optional(),
  mcqSectionTitle: z.string().max(120).optional(),
  cqSectionTitle: z.string().max(120).optional()
});

export const questionBankRouter = Router();

questionBankRouter.use(requireAuth);

function ensureDatabase() {
  if (!env.MONGODB_URI || mongoose.connection.readyState === 0) {
    throw new ApiError(503, "Question bank requires a MongoDB connection");
  }
}

function checkQuestionBankAccess(planCode: string, role?: string) {
  if (role === "admin") return;
  const plan = getPlan(planCode as any);
  if (!plan.questionBank) {
    throw new ApiError(403, "Question Bank access requires a Small, Pro, Ultra, or Diamond package subscription. Please upgrade your package.");
  }
}

function checkRandomGeneratorAccess(planCode: string, role?: string) {
  if (role === "admin") return;
  const plan = getPlan(planCode as any);
  if (!plan.randomGenerator) {
    throw new ApiError(403, "Random Paper Generator requires a Small, Pro, Ultra, or Diamond package subscription. Please upgrade your package.");
  }
}

// GET /api/question-bank/hierarchy - List classes -> subjects -> chapters with question counts
questionBankRouter.get("/hierarchy", asyncHandler(async (req, res) => {
  ensureDatabase();
  const ownerId = req.user!.id;

  const tree = await getCurriculumTree(ownerId);
  if (tree && tree.length > 0) {
    return ok(res, tree);
  }

  const results = await QuestionBankItemModel.aggregate([
    {
      $match: {
        $or: [{ ownerId }, { ownerId: "usr_demo_teacher" }, { ownerId: "system" }]
      }
    },
    {
      $group: {
        _id: {
          className: "$className",
          subject: "$subject",
          chapter: "$chapter",
          type: "$type"
        },
        count: { $sum: 1 }
      }
    }
  ]);

  type ChapterData = { name: string; mcqCount: number; cqCount: number; totalCount: number };
  type SubjectData = { name: string; mcqCount: number; cqCount: number; totalCount: number; chapters: Map<string, ChapterData> };
  type ClassData = { className: string; mcqCount: number; cqCount: number; totalCount: number; subjects: Map<string, SubjectData> };

  const classMap = new Map<string, ClassData>();

  for (const item of results) {
    // Normalize Bengali class/subject names to canonical English names so that
    // Bengali-seeded data and English-seeded data are merged under the same entry.
    const rawCls = item._id.className || "SSC (Class 9-10)";
    const rawSubj = item._id.subject || item._id.category || "General";
    const clsName = canonicalClass(rawCls);
    const subjName = canonicalSubject(rawSubj);
    const chName = item._id.chapter || "General";
    const qType = item._id.type || "mcq";
    const count = item.count || 0;

    let cls = classMap.get(clsName);
    if (!cls) {
      cls = { className: clsName, mcqCount: 0, cqCount: 0, totalCount: 0, subjects: new Map() };
      classMap.set(clsName, cls);
    }

    let subj = cls.subjects.get(subjName);
    if (!subj) {
      subj = { name: subjName, mcqCount: 0, cqCount: 0, totalCount: 0, chapters: new Map() };
      cls.subjects.set(subjName, subj);
    }

    // Chapters from different language seeds have different names for the same
    // concept (e.g. "Chapter 1: Motion" vs "অধ্যায় ২: গতি"). Keep them as
    // separate chapter entries — the user can filter by whichever they see.
    let ch = subj.chapters.get(chName);
    if (!ch) {
      ch = { name: chName, mcqCount: 0, cqCount: 0, totalCount: 0 };
      subj.chapters.set(chName, ch);
    }

    if (qType === "mcq") {
      ch.mcqCount += count;
      subj.mcqCount += count;
      cls.mcqCount += count;
    } else {
      ch.cqCount += count;
      subj.cqCount += count;
      cls.cqCount += count;
    }
    ch.totalCount += count;
    subj.totalCount += count;
    cls.totalCount += count;
  }

  const output = Array.from(classMap.values()).map((cls) => ({
    className: cls.className,
    mcqCount: cls.mcqCount,
    cqCount: cls.cqCount,
    totalCount: cls.totalCount,
    subjects: Array.from(cls.subjects.values()).map((subj) => ({
      name: subj.name,
      mcqCount: subj.mcqCount,
      cqCount: subj.cqCount,
      totalCount: subj.totalCount,
      chapters: Array.from(subj.chapters.values()).sort((a, b) => {
        const numA = extractChapterNumber(a.name);
        const numB = extractChapterNumber(b.name);
        if (numA !== numB) return numA - numB;
        return a.name.localeCompare(b.name, "bn", { numeric: true, sensitivity: "base" });
      })
    }))
  }));

  output.sort((a, b) => {
    if (a.className.includes("SSC") && !b.className.includes("SSC")) return -1;
    if (!a.className.includes("SSC") && b.className.includes("SSC")) return 1;
    if (a.className.includes("HSC") && !b.className.includes("HSC")) return -1;
    if (!a.className.includes("HSC") && b.className.includes("HSC")) return 1;
    return a.className.localeCompare(b.className);
  });

  return ok(res, output);
}));

// GET /api/question-bank - List and filter questions from bank
questionBankRouter.get("/", asyncHandler(async (req, res) => {
  ensureDatabase();

  const andConditions: any[] = [
    {
      $or: [
        { ownerId: req.user!.id },
        { ownerId: "usr_demo_teacher" },
        { ownerId: "system" }
      ]
    }
  ];

  const classId = req.query.classId ? String(req.query.classId).trim() : "";
  const subjectId = req.query.subjectId ? String(req.query.subjectId).trim() : "";
  const chapterId = req.query.chapterId ? String(req.query.chapterId).trim() : "";
  const className = req.query.className ? String(req.query.className).trim() : "";
  const subject = req.query.subject ? String(req.query.subject).trim() : "";
  const chapter = req.query.chapter ? String(req.query.chapter).trim() : "";
  const type = req.query.type ? String(req.query.type).trim() : "";
  const nature = req.query.nature ? String(req.query.nature).trim() : "";
  const category = req.query.category ? String(req.query.category).trim() : "";
  const difficulty = req.query.difficulty ? String(req.query.difficulty).trim() : "";
  const tag = req.query.tag ? String(req.query.tag).trim() : "";
  const board = req.query.board ? String(req.query.board).trim() : "";
  const year = req.query.year ? String(req.query.year).trim() : "";
  const sortBy = req.query.sortBy ? String(req.query.sortBy).trim() : "newest";
  const search = req.query.search ? String(req.query.search).trim() : "";

  // chapter: match by chapterId OR by exact chapter name (seeded questions have no chapterId)
  if (chapterId && chapterId !== "all") {
    const chapterNameCond = (chapter && chapter !== "all" && chapter !== "All Chapters")
      ? { chapter: { $regex: new RegExp(`^${escapeRegex(chapter.trim())}$`, "i") } }
      : null;
    andConditions.push(chapterNameCond
      ? { $or: [{ chapterId }, chapterNameCond] }
      : { chapterId });
  } else if (chapter && chapter !== "all" && chapter !== "All Chapters") {
    // Exact match — chapter names come from the hierarchy which reads the DB directly,
    // so the value is already the exact string stored in MongoDB.
    andConditions.push({ chapter: { $regex: new RegExp(`^${escapeRegex(chapter.trim())}$`, "i") } });
  }

  // subject: match by subjectId OR by name aliases (seeded questions have no subjectId)
  if (subjectId && subjectId !== "all") {
    const subjectNameCond = (subject && subject !== "all")
      ? buildSubjectCondition(canonicalSubject(subject))
      : null;
    andConditions.push(subjectNameCond
      ? { $or: [{ subjectId }, subjectNameCond] }
      : { subjectId });
  } else if (subject && subject !== "all") {
    // Canonicalize to English first, then match all known Bengali/English aliases
    andConditions.push(buildSubjectCondition(canonicalSubject(subject)));
  }

  // class: match by classId OR by name aliases (seeded questions have no classId)
  if (classId && classId !== "all") {
    const classNameCond = (className && className !== "all")
      ? buildClassCondition(canonicalClass(className))
      : null;
    andConditions.push(classNameCond
      ? { $or: [{ classId }, classNameCond] }
      : { classId });
  } else if (className && className !== "all") {
    // Canonicalize to English first, then match all known aliases in the DB
    andConditions.push(buildClassCondition(canonicalClass(className)));
  }

  if (board && board !== "all") {
    andConditions.push({
      $or: [
        { board: { $regex: new RegExp(escapeRegex(board), "i") } },
        { tags: { $regex: new RegExp(escapeRegex(board), "i") } }
      ]
    });
  }

  if (year && year !== "all") {
    andConditions.push({
      $or: [
        { year: String(year) },
        { tags: { $regex: new RegExp(escapeRegex(year), "i") } }
      ]
    });
  }

  if (tag && tag !== "all") {
    const tagList = tag.split(",").map((t) => t.trim()).filter(Boolean);
    if (tagList.length === 1) {
      andConditions.push({ tags: { $regex: new RegExp(escapeRegex(tagList[0]), "i") } });
    } else if (tagList.length > 1) {
      andConditions.push({ tags: { $in: tagList.map((t) => new RegExp(escapeRegex(t), "i")) } });
    }
  }

  if (type && type !== "all") {
    andConditions.push({ type });
  }

  if (nature && nature !== "all") {
    andConditions.push({ nature });
  }

  if (difficulty && difficulty !== "all") {
    andConditions.push({ difficulty });
  }

  if (category && category !== "all") {
    andConditions.push({ category: { $regex: new RegExp(`^${escapeRegex(category)}$`, "i") } });
  }

  if (req.query.hasImage === "true") {
    andConditions.push({ imageUrl: { $exists: true, $ne: "", $type: "string" } });
  }

  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    andConditions.push({
      $or: [
        { title: rx },
        { subtitle: rx },
        { subject: rx },
        { chapter: rx },
        { category: rx },
        { explanation: rx },
        { board: rx },
        { year: rx },
        { tags: rx }
      ]
    });
  }

  const match = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

  const pageParam = Number(req.query.page);
  const page = !isNaN(pageParam) && pageParam > 0 ? pageParam : 1;

  const limitQuery = req.query.limit !== undefined ? String(req.query.limit).trim().toLowerCase() : "";
  let limit = 50;
  let isUnlimited = false;

  if (limitQuery === "all" || limitQuery === "0") {
    isUnlimited = true;
    limit = 10000;
  } else if (limitQuery) {
    const parsed = Number(limitQuery);
    if (!isNaN(parsed) && parsed > 0) {
      limit = parsed;
    }
  }

  let mongoSort: any = { updatedAt: -1, createdAt: -1 };
  if (sortBy === "oldest") {
    mongoSort = { createdAt: 1 };
  } else if (sortBy === "title") {
    mongoSort = { title: 1 };
  } else if (sortBy === "most_used") {
    mongoSort = { usageCount: -1, updatedAt: -1 };
  } else if (sortBy === "chapter") {
    mongoSort = { chapter: 1, title: 1 };
  }

  const totalCount = await QuestionBankItemModel.countDocuments(match);
  res.setHeader("X-Total-Count", totalCount.toString());
  res.setHeader("X-Page", page.toString());
  res.setHeader("X-Limit", limit.toString());

  const skip = isUnlimited ? 0 : (page - 1) * limit;

  const questions = await QuestionBankItemModel.find(match)
    .select("-_id")
    .sort(mongoSort)
    .skip(skip)
    .limit(limit)
    .lean<QuestionBankItemRecord[]>();

  const enriched = await enrichQuestionsWithCurriculum(questions);

  if (sortBy === "chapter") {
    enriched.sort((a, b) => {
      const numA = extractChapterNumber(a.chapter || "");
      const numB = extractChapterNumber(b.chapter || "");
      if (numA !== numB) return numA - numB;
      const chComp = (a.chapter || "").localeCompare(b.chapter || "", "bn");
      if (chComp !== 0) return chComp;
      return (a.title || "").localeCompare(b.title || "", "bn");
    });
  }

  const totalPages = Math.ceil(totalCount / limit) || 1;

  if (req.query.paginate === "true") {
    return ok(res, {
      items: enriched,
      total: totalCount,
      page,
      totalPages,
      limit
    });
  }

  return ok(res, enriched);
}));

// GET /api/question-bank/categories - List categories with counts
questionBankRouter.get("/categories", asyncHandler(async (req, res) => {
  ensureDatabase();
  const ownerId = req.user!.id;

  const results = await QuestionBankItemModel.aggregate([
    {
      $match: {
        $or: [{ ownerId }, { ownerId: "usr_demo_teacher" }, { ownerId: "system" }]
      }
    },
    {
      $group: {
        _id: { $ifNull: ["$subject", "$category"] },
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const categories = results
    .filter((r) => r._id)
    .map((r) => ({
      name: r._id,
      count: r.count
    }));

  return ok(res, categories);
}));

// GET /api/question-bank/tags - List distinct tags with counts
questionBankRouter.get("/tags", asyncHandler(async (req, res) => {
  ensureDatabase();
  const ownerId = req.user!.id;

  const results = await QuestionBankItemModel.aggregate([
    {
      $match: {
        $or: [{ ownerId }, { ownerId: "usr_demo_teacher" }, { ownerId: "system" }],
        tags: { $exists: true, $type: "array", $ne: [] }
      }
    },
    { $unwind: "$tags" },
    {
      $group: {
        _id: "$tags",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 100 }
  ]);

  const tags = results
    .map((r) => ({ name: String(r._id).trim(), count: r.count }))
    .filter((t) => t.name.length > 0);

  return ok(res, tags);
}));

// GET /api/question-bank/boards - List distinct boards with counts
questionBankRouter.get("/boards", asyncHandler(async (req, res) => {
  ensureDatabase();
  const ownerId = req.user!.id;
  const match = {
    $or: [{ ownerId }, { ownerId: "usr_demo_teacher" }, { ownerId: "system" }],
    board: { $exists: true, $ne: null, $nin: ["", "all"] }
  };

  const results = await QuestionBankItemModel.aggregate([
    { $match: match },
    { $group: { _id: "$board", count: { $sum: 1 } } },
    { $sort: { count: -1, _id: 1 } }
  ]);

  return ok(res, results.map((r) => ({ name: String(r._id).trim(), count: r.count })));
}));

// GET /api/question-bank/years - List distinct years with counts
questionBankRouter.get("/years", asyncHandler(async (req, res) => {
  ensureDatabase();
  const ownerId = req.user!.id;
  const match = {
    $or: [{ ownerId }, { ownerId: "usr_demo_teacher" }, { ownerId: "system" }],
    year: { $exists: true, $ne: null, $nin: ["", "all"] }
  };

  const results = await QuestionBankItemModel.aggregate([
    { $match: match },
    { $group: { _id: "$year", count: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ]);

  return ok(res, results.map((r) => ({ name: String(r._id).trim(), count: r.count })));
}));

// GET /api/question-bank/:id - Get single question
questionBankRouter.get("/:id", asyncHandler(async (req, res) => {
  ensureDatabase();
  const filter = req.user!.role === "admin" ? { id: req.params.id } : { id: req.params.id, ownerId: req.user!.id };
  const question = await QuestionBankItemModel.findOne(filter)
    .select("-_id")
    .lean<QuestionBankItemRecord>();

  if (!question) throw new ApiError(404, "Question not found in bank");
  const [enriched] = await enrichQuestionsWithCurriculum([question]);
  return ok(res, enriched);
}));

// POST /api/question-bank - Create new question in bank
questionBankRouter.post("/", validate(bankQuestionSchema), asyncHandler(async (req, res) => {
  ensureDatabase();
  checkQuestionBankAccess(req.user!.plan, req.user!.role);

  if (req.user!.role !== "admin") {
    throw new ApiError(403, "Only administrators can add questions to the Question Bank");
  }

  const payload = { ...req.body };

  // Resolve canonical curriculum IDs
  const resolved = await resolveCurriculumMetadata({
    classId: payload.classId,
    subjectId: payload.subjectId,
    chapterId: payload.chapterId,
    className: payload.className,
    subject: payload.subject,
    chapter: payload.chapter
  });

  if (!resolved.classId || !resolved.subjectId || !resolved.chapterId) {
    throw new ApiError(400, "Valid chapterId (or recognizable chapter & subject) is required");
  }

  const category = payload.category || resolved.subject || "General";
  delete payload.className;
  delete payload.subject;
  delete payload.chapter;

  if (payload.type === "mcq" && payload.options && payload.correctIndex >= payload.options.length) {
    throw new ApiError(400, "Correct option index out of bounds");
  }

  const timestamp = new Date().toISOString();
  const question = await QuestionBankItemModel.create({
    id: `bank_${nanoid(10)}`,
    ownerId: req.user!.id,
    ...payload,
    classId: resolved.classId,
    subjectId: resolved.subjectId,
    chapterId: resolved.chapterId,
    category,
    usageCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  const { _id, ...savedQuestion } = question.toObject({ versionKey: false });
  const [enriched] = await enrichQuestionsWithCurriculum([savedQuestion]);
  return ok(res, enriched, "Question saved to bank", 201);
}));

// PUT /api/question-bank/:id - Update existing question
questionBankRouter.put("/:id", validate(updateBankQuestionSchema), asyncHandler(async (req, res) => {
  ensureDatabase();
  checkQuestionBankAccess(req.user!.plan, req.user!.role);

  if (req.user!.role !== "admin") {
    throw new ApiError(403, "Only admins can edit questions in the Question Bank");
  }

  const filter = { id: req.params.id };
  const existing = await QuestionBankItemModel.findOne(filter);
  if (!existing) throw new ApiError(404, "Question not found");

  const qType = req.body.type || existing.type;
  if (qType === "mcq") {
    if (req.body.options && req.body.correctIndex !== undefined) {
      if (req.body.correctIndex >= req.body.options.length) {
        throw new ApiError(400, "Correct option index out of bounds");
      }
    } else if (req.body.options && existing.correctIndex >= req.body.options.length) {
      throw new ApiError(400, "Existing correct option index exceeds new options count");
    }
  }

  const payload = { ...req.body };

  if (payload.classId || payload.subjectId || payload.chapterId || payload.className || payload.subject || payload.chapter) {
    const resolved = await resolveCurriculumMetadata({
      classId: payload.classId ?? existing.classId,
      subjectId: payload.subjectId ?? existing.subjectId,
      chapterId: payload.chapterId ?? existing.chapterId,
      className: payload.className,
      subject: payload.subject,
      chapter: payload.chapter
    });
    if (resolved.classId) payload.classId = resolved.classId;
    if (resolved.subjectId) payload.subjectId = resolved.subjectId;
    if (resolved.chapterId) payload.chapterId = resolved.chapterId;
  }
  delete payload.className;
  delete payload.subject;
  delete payload.chapter;

  const updated = await QuestionBankItemModel.findOneAndUpdate(
    filter,
    {
      $set: {
        ...payload,
        updatedAt: new Date().toISOString()
      }
    },
    { new: true, projection: { _id: 0 } }
  ).lean<QuestionBankItemRecord>();

  if (!updated) throw new ApiError(404, "Question not found");
  const [enriched] = await enrichQuestionsWithCurriculum([updated]);
  return ok(res, enriched, "Question updated successfully");
}));

// DELETE /api/question-bank/:id - Delete question
questionBankRouter.delete("/:id", asyncHandler(async (req, res) => {
  ensureDatabase();
  checkQuestionBankAccess(req.user!.plan, req.user!.role);

  if (req.user!.role !== "admin") {
    throw new ApiError(403, "Only admins can delete questions from the Question Bank");
  }

  const filter = { id: req.params.id };
  const result = await QuestionBankItemModel.deleteOne(filter);
  if (result.deletedCount === 0) throw new ApiError(404, "Question not found");

  return ok(res, { id: req.params.id }, "Question deleted from bank");
}));

// POST /api/question-bank/batch - Bulk create questions
questionBankRouter.post("/batch", validate(batchBankQuestionSchema), asyncHandler(async (req, res) => {
  ensureDatabase();
  checkQuestionBankAccess(req.user!.plan, req.user!.role);

  if (req.user!.role !== "admin") {
    throw new ApiError(403, "Only administrators can add questions to the Question Bank");
  }

  const timestamp = new Date().toISOString();
  const items = await Promise.all(
    req.body.questions.map(async (q: any) => {
      const resolved = await resolveCurriculumMetadata({
        classId: q.classId,
        subjectId: q.subjectId,
        chapterId: q.chapterId,
        className: q.className,
        subject: q.subject,
        chapter: q.chapter
      });
      const { className, subject, chapter, ...cleanQ } = q;
      return {
        id: `bank_${nanoid(10)}`,
        ownerId: req.user!.id,
        ...cleanQ,
        classId: resolved.classId || q.classId,
        subjectId: resolved.subjectId || q.subjectId,
        chapterId: resolved.chapterId || q.chapterId,
        category: q.category || resolved.subject || "General",
        usageCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp
      };
    })
  );

  const created = await QuestionBankItemModel.insertMany(items);
  return ok(res, created.length, `${created.length} question(s) saved to bank`, 201);
}));

// POST /api/question-bank/generate-paper - Smart Question Paper Generator
questionBankRouter.post("/generate-paper", validate(generatePaperSchema), asyncHandler(async (req, res) => {
  ensureDatabase();
  checkRandomGeneratorAccess(req.user!.plan, req.user!.role);

  const {
    name,
    classId: rawClassId,
    subjectId: rawSubjectId,
    chapterId: rawChapterId,
    className: rawClassName,
    subject: rawSubject,
    chapter: rawChapter,
    type,
    mcqCount,
    mcqTheoryCount,
    mcqMathCount,
    cqCount,
    cqTheoryCount,
    cqMathCount,
    difficulty,
    examType,
    duration,
    layout,
    instructions,
    mcqSectionTitle,
    cqSectionTitle,
    tag,
    board,
    year,
    boardOnly
  } = req.body;

  const resolved = await resolveCurriculumMetadata({
    classId: rawClassId,
    subjectId: rawSubjectId,
    chapterId: rawChapterId,
    className: rawClassName,
    subject: rawSubject,
    chapter: rawChapter !== "all" && rawChapter !== "All Chapters" ? rawChapter : undefined
  });

  const finalClassId = rawClassId || resolved.classId;
  const finalSubjectId = rawSubjectId || resolved.subjectId;
  const finalChapterId = rawChapterId || (rawChapter !== "all" && rawChapter !== "All Chapters" ? resolved.chapterId : undefined);
  const paperClassName = resolved.className || rawClassName || "SSC (Class 9-10)";
  const paperSubject = resolved.subject || rawSubject || "General";

  const andConditions: any[] = [
    {
      $or: [{ ownerId: req.user!.id }, { ownerId: "usr_demo_teacher" }, { ownerId: "system" }]
    }
  ];

  if (finalChapterId && finalChapterId !== "all") {
    andConditions.push({ chapterId: finalChapterId });
  }

  if (finalSubjectId && finalSubjectId !== "all") {
    andConditions.push({ subjectId: finalSubjectId });
  }

  if (finalClassId && finalClassId !== "all") {
    andConditions.push({ classId: finalClassId });
  }

  if (board && board !== "all") {
    andConditions.push({
      $or: [
        { board: { $regex: new RegExp(escapeRegex(board), "i") } },
        { tags: { $regex: new RegExp(escapeRegex(board), "i") } }
      ]
    });
  }

  if (year && year !== "all") {
    andConditions.push({
      $or: [
        { year: String(year) },
        { tags: { $regex: new RegExp(escapeRegex(year), "i") } }
      ]
    });
  }

  if (boardOnly) {
    andConditions.push({ tags: { $regex: /(?:বোর্ড|board|\bssc\b|\bhsc\b)/i } });
  }

  if (tag && tag !== "all") {
    andConditions.push({ tags: { $regex: new RegExp(escapeRegex(tag), "i") } });
  }

  if (difficulty && difficulty !== "all") {
    andConditions.push({ difficulty });
  }

  const baseMatch = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

  let sampledMcqs: QuestionBankItemRecord[] = [];
  let sampledCqs: QuestionBankItemRecord[] = [];

  if ((type === "mcq" || type === "both") && mcqCount > 0) {
    const hasExplicitMcqDistribution = mcqTheoryCount !== undefined || mcqMathCount !== undefined;
    if (hasExplicitMcqDistribution) {
      const targetTheory = Math.max(0, mcqTheoryCount ?? (mcqCount - (mcqMathCount ?? 0)));
      const targetMath = Math.max(0, mcqMathCount ?? (mcqCount - targetTheory));

      const theoryList = targetTheory > 0
        ? await QuestionBankItemModel.aggregate<QuestionBankItemRecord>([
            { $match: { ...baseMatch, type: "mcq", nature: "theory" } },
            { $sample: { size: targetTheory } },
            { $project: { _id: 0 } }
          ])
        : [];

      const mathList = targetMath > 0
        ? await QuestionBankItemModel.aggregate<QuestionBankItemRecord>([
            { $match: { ...baseMatch, type: "mcq", nature: "mathematical" } },
            { $sample: { size: targetMath } },
            { $project: { _id: 0 } }
          ])
        : [];

      sampledMcqs = [...theoryList, ...mathList];

      if (sampledMcqs.length < mcqCount) {
        const existingIds = sampledMcqs.map((q) => q.id);
        const remainder = await QuestionBankItemModel.aggregate<QuestionBankItemRecord>([
          { $match: { ...baseMatch, type: "mcq", id: { $nin: existingIds } } },
          { $sample: { size: mcqCount - sampledMcqs.length } },
          { $project: { _id: 0 } }
        ]);
        sampledMcqs.push(...remainder);
      }
    } else {
      sampledMcqs = await QuestionBankItemModel.aggregate<QuestionBankItemRecord>([
        { $match: { ...baseMatch, type: "mcq" } },
        { $sample: { size: mcqCount } },
        { $project: { _id: 0 } }
      ]);
    }
  }

  if ((type === "cq" || type === "both") && cqCount > 0) {
    const hasExplicitCqDistribution = cqTheoryCount !== undefined || cqMathCount !== undefined;
    if (hasExplicitCqDistribution) {
      const targetTheory = Math.max(0, cqTheoryCount ?? (cqCount - (cqMathCount ?? 0)));
      const targetMath = Math.max(0, cqMathCount ?? (cqCount - targetTheory));

      const theoryList = targetTheory > 0
        ? await QuestionBankItemModel.aggregate<QuestionBankItemRecord>([
            { $match: { ...baseMatch, type: "cq", nature: "theory" } },
            { $sample: { size: targetTheory } },
            { $project: { _id: 0 } }
          ])
        : [];

      const mathList = targetMath > 0
        ? await QuestionBankItemModel.aggregate<QuestionBankItemRecord>([
            { $match: { ...baseMatch, type: "cq", nature: "mathematical" } },
            { $sample: { size: targetMath } },
            { $project: { _id: 0 } }
          ])
        : [];

      sampledCqs = [...theoryList, ...mathList];

      if (sampledCqs.length < cqCount) {
        const existingIds = sampledCqs.map((q) => q.id);
        const remainder = await QuestionBankItemModel.aggregate<QuestionBankItemRecord>([
          { $match: { ...baseMatch, type: "cq", id: { $nin: existingIds } } },
          { $sample: { size: cqCount - sampledCqs.length } },
          { $project: { _id: 0 } }
        ]);
        sampledCqs.push(...remainder);
      }
    } else {
      sampledCqs = await QuestionBankItemModel.aggregate<QuestionBankItemRecord>([
        { $match: { ...baseMatch, type: "cq" } },
        { $sample: { size: cqCount } },
        { $project: { _id: 0 } }
      ]);
    }
  }

  if (sampledMcqs.length === 0 && sampledCqs.length === 0) {
    throw new ApiError(
      400,
      `No questions found in Question Bank matching "${paperSubject}" (${rawChapter === "all" ? "All Chapters" : rawChapter}). Please ensure questions exist for this selection.`
    );
  }

  // Convert MCQs to Paper Questions
  const paperMcqs = sampledMcqs.map((item, idx) => ({
    id: `q_mcq_${nanoid(8)}`,
    number: `${idx + 1}`,
    title: item.title,
    subtitle: item.subtitle || undefined,
    imageUrl: item.imageUrl || undefined,
    marks: item.marks || 1,
    explanation: item.explanation || undefined,
    type: "mcq" as const,
    options: item.options.map((optText, optIndex) => ({
      id: `opt_${nanoid(8)}`,
      label: String.fromCharCode(65 + optIndex),
      text: optText,
      isCorrect: optIndex === item.correctIndex
    }))
  }));

  // Convert CQs to Paper Questions
  const banglaLabels = ["ক", "খ", "গ", "ঘ"];
  const paperCqs = sampledCqs.map((item, idx) => {
    const subQuestions =
      item.subQuestions && item.subQuestions.length > 0
        ? item.subQuestions.map((sq, sqIdx) => ({
            id: `sq_${nanoid(8)}`,
            label: sq.label || banglaLabels[sqIdx] || String.fromCharCode(97 + sqIdx),
            text: sq.text,
            marks: sq.marks || (sqIdx === 0 ? 1 : sqIdx === 1 ? 2 : sqIdx === 2 ? 3 : 4),
            answer: sq.answer || undefined,
            explanation: sq.explanation || undefined
          }))
        : [
            { id: `sq_${nanoid(8)}`, label: "ক", text: "জ্ঞানমূলক প্রশ্ন", marks: 1 },
            { id: `sq_${nanoid(8)}`, label: "খ", text: "অনুধাবনমূলক প্রশ্ন", marks: 2 },
            { id: `sq_${nanoid(8)}`, label: "গ", text: "প্রয়োগমূলক প্রশ্ন", marks: 3 },
            { id: `sq_${nanoid(8)}`, label: "ঘ", text: "উচ্চতর দক্ষতামূলক প্রশ্ন", marks: 4 }
          ];

    const cqTotalMarks = subQuestions.reduce((sum, sq) => sum + sq.marks, 0);

    return {
      id: `q_cq_${nanoid(8)}`,
      number: `${paperMcqs.length + idx + 1}`,
      title: item.title,
      subtitle: item.subtitle || undefined,
      imageUrl: item.imageUrl || undefined,
      marks: cqTotalMarks || 10,
      explanation: item.explanation || undefined,
      type: "cq" as const,
      options: [],
      subQuestions
    };
  });

  const allQuestions = [...paperMcqs, ...paperCqs];
  const totalMarks = allQuestions.reduce((sum, q) => sum + q.marks, 0);

  let defaultInstructions = instructions;
  if (!defaultInstructions) {
    if (type === "mcq") {
      defaultInstructions = `Choose the best answer for each question. All questions carry equal marks (1×${paperMcqs.length}=${paperMcqs.length}).`;
    } else if (type === "cq") {
      defaultInstructions = `Read each stem carefully and answer all sub-questions. All Creative Questions carry equal marks (10×${paperCqs.length}=${totalMarks}).`;
    } else {
      defaultInstructions = `Section A (MCQ): Answer all ${paperMcqs.length} questions (${paperMcqs.length} marks). Section B (CQ): Answer ${paperCqs.length} Creative Questions (${paperCqs.reduce((s, q) => s + q.marks, 0)} marks).`;
    }
  }

  // Create paper record
  const createdPaper = await createPaper(req.user!.id, req.user!.plan, {
    name,
    subject: paperSubject,
    className: paperClassName,
    examType,
    duration,
    totalMarks,
    instructions: defaultInstructions,
    questionNumberStyle: "numeric",
    optionLabelStyle: "upper-alpha",
    questionsPerPage: req.body.questionsPerPage !== undefined ? Number(req.body.questionsPerPage) : 10,
    layout,
    mcqSectionTitle: mcqSectionTitle?.trim() || undefined,
    cqSectionTitle: cqSectionTitle?.trim() || undefined
  }, req);

  // Attach questions
  const finalizedPaper = await updatePaperQuestions(createdPaper.id, req.user!.id, req.user!.plan, allQuestions as any);

  // Update bank usage counts
  const sampledIds = [...sampledMcqs.map((q) => q.id), ...sampledCqs.map((q) => q.id)];
  if (sampledIds.length > 0) {
    await QuestionBankItemModel.updateMany(
      { id: { $in: sampledIds } },
      { $inc: { usageCount: 1 }, $set: { updatedAt: new Date().toISOString() } }
    );
  }

  return ok(
    res,
    finalizedPaper,
    `Generated paper "${finalizedPaper.name}" with ${paperMcqs.length} MCQs and ${paperCqs.length} CQs (${totalMarks} marks)`,
    201
  );
}));

// POST /api/question-bank/create-paper - Create exam paper with selected bank questions
questionBankRouter.post("/create-paper", validate(createPaperFromSelectedSchema), asyncHandler(async (req, res) => {
  ensureDatabase();
  checkQuestionBankAccess(req.user!.plan, req.user!.role);

  const {
    bankQuestionIds,
    name,
    className,
    subject,
    examType,
    duration,
    totalMarks,
    layout,
    cqLayout,
    questionsPerPage,
    questionNumberStyle,
    optionLabelStyle,
    instructions,
    mcqSectionTitle,
    cqSectionTitle
  } = req.body;

  const bankItems = await QuestionBankItemModel.find({
    id: { $in: bankQuestionIds },
    $or: [{ ownerId: req.user!.id }, { ownerId: "usr_demo_teacher" }, { ownerId: "system" }]
  }).lean<QuestionBankItemRecord[]>();

  if (!bankItems || bankItems.length === 0) {
    throw new ApiError(404, "No matching question bank items found");
  }

  // Preserve user selection order
  const itemMap = new Map<string, QuestionBankItemRecord>(bankItems.map((item) => [item.id, item]));
  const orderedItems: QuestionBankItemRecord[] = bankQuestionIds
    .map((id: string) => itemMap.get(id))
    .filter((item: QuestionBankItemRecord | undefined): item is QuestionBankItemRecord => Boolean(item));

  const toBn = (n: number) => n.toString().replace(/[0-9]/g, (d) => ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"][Number(d)]);

  const mcqItems = orderedItems.filter(
    (item: QuestionBankItemRecord) => (item.type || "mcq") === "mcq" && (!item.subQuestions || item.subQuestions.length === 0)
  );
  const cqItems = orderedItems.filter(
    (item: QuestionBankItemRecord) => item.type === "cq" || (item.subQuestions && item.subQuestions.length > 0)
  );

  const paperMcqs = mcqItems.map((item: QuestionBankItemRecord, idx: number) => ({
    id: `q_mcq_${nanoid(8)}`,
    number: questionNumberStyle === "bangla" ? toBn(idx + 1) : `${idx + 1}`,
    title: item.title,
    subtitle: item.subtitle || undefined,
    imageUrl: item.imageUrl || undefined,
    marks: item.marks || 1,
    explanation: item.explanation || undefined,
    type: "mcq" as const,
    options: (item.options || []).map((optText: string, optIndex: number) => ({
      id: `opt_${nanoid(8)}`,
      label: String.fromCharCode(65 + optIndex),
      text: optText,
      isCorrect: optIndex === item.correctIndex
    }))
  }));

  const banglaLabels = ["ক", "খ", "গ", "ঘ"];
  const paperCqs = cqItems.map((item: QuestionBankItemRecord, idx: number) => {
    const subQuestions =
      item.subQuestions && item.subQuestions.length > 0
        ? item.subQuestions.map((sq: any, sqIdx: number) => ({
            id: `sq_${nanoid(8)}`,
            label: sq.label || banglaLabels[sqIdx] || String.fromCharCode(97 + sqIdx),
            text: sq.text,
            marks: sq.marks || (sqIdx === 0 ? 1 : sqIdx === 1 ? 2 : sqIdx === 2 ? 3 : 4),
            answer: sq.answer || undefined,
            explanation: sq.explanation || undefined
          }))
        : [
            { id: `sq_${nanoid(8)}`, label: "ক", text: "জ্ঞানমূলক প্রশ্ন", marks: 1 },
            { id: `sq_${nanoid(8)}`, label: "খ", text: "অনুধাবনমূলক প্রশ্ন", marks: 2 },
            { id: `sq_${nanoid(8)}`, label: "গ", text: "প্রয়োগমূলক প্রশ্ন", marks: 3 },
            { id: `sq_${nanoid(8)}`, label: "ঘ", text: "উচ্চতর দক্ষতামূলক প্রশ্ন", marks: 4 }
          ];

    const cqTotalMarks = subQuestions.reduce((sum: number, sq: any) => sum + sq.marks, 0);

    return {
      id: `q_cq_${nanoid(8)}`,
      number: questionNumberStyle === "bangla" ? toBn(paperMcqs.length + idx + 1) : `${paperMcqs.length + idx + 1}`,
      title: item.title,
      subtitle: item.subtitle || undefined,
      imageUrl: item.imageUrl || undefined,
      marks: item.marks || cqTotalMarks || 10,
      explanation: item.explanation || undefined,
      type: "cq" as const,
      options: [],
      subQuestions
    };
  });

  const allQuestions = [...paperMcqs, ...paperCqs];
  const calculatedTotalMarks = totalMarks || allQuestions.reduce((sum: number, q: any) => sum + q.marks, 0);

  let defaultInstructions = instructions?.trim();
  if (!defaultInstructions) {
    if (paperCqs.length === 0) {
      defaultInstructions = `Choose the best answer for each question. All questions carry equal marks (1×${paperMcqs.length}=${calculatedTotalMarks}).`;
    } else if (paperMcqs.length === 0) {
      defaultInstructions = `Read each stem carefully and answer all sub-questions. All Creative Questions carry equal marks (10×${paperCqs.length}=${calculatedTotalMarks}).`;
    } else {
      defaultInstructions = `Section A (MCQ): Answer all ${paperMcqs.length} questions (${paperMcqs.length} marks). Section B (CQ): Answer ${paperCqs.length} Creative Questions (${paperCqs.reduce((s: number, q: any) => s + q.marks, 0)} marks).`;
    }
  }

  // Create paper record
  const createdPaper = await createPaper(
    req.user!.id,
    req.user!.plan,
    {
      name,
      subject,
      className,
      examType,
      duration,
      totalMarks: calculatedTotalMarks,
      instructions: defaultInstructions,
      questionNumberStyle: (questionNumberStyle === "bangla" ? "numeric" : questionNumberStyle) || "numeric",
      optionLabelStyle: optionLabelStyle || "bangla",
      questionsPerPage: questionsPerPage !== undefined ? Number(questionsPerPage) : 10,
      layout,
      cqLayout: cqLayout || layout,
      mcqSectionTitle: mcqSectionTitle?.trim() || undefined,
      cqSectionTitle: cqSectionTitle?.trim() || undefined
    },
    req
  );

  // Attach questions with quota validation
  const finalizedPaper = await updatePaperQuestions(createdPaper.id, req.user!.id, req.user!.plan, allQuestions as any);

  // Update bank usage counts
  const itemIds = orderedItems.map((q: QuestionBankItemRecord) => q.id);
  if (itemIds.length > 0) {
    await QuestionBankItemModel.updateMany(
      { id: { $in: itemIds } },
      { $inc: { usageCount: 1 }, $set: { updatedAt: new Date().toISOString() } }
    );
  }

  return ok(
    res,
    finalizedPaper,
    `Question paper "${finalizedPaper.name}" created with ${paperMcqs.length} MCQs and ${paperCqs.length} CQs (${calculatedTotalMarks} marks)`,
    201
  );
}));

// POST /api/question-bank/random - Legacy MCQ sampling
questionBankRouter.post("/random", validate(randomSchema), asyncHandler(async (req, res) => {
  ensureDatabase();
  checkRandomGeneratorAccess(req.user!.plan, req.user!.role);

  const andConditions: any[] = [
    {
      $or: [{ ownerId: req.user!.id }, { ownerId: "usr_demo_teacher" }, { ownerId: "system" }]
    }
  ];
  if (req.body.category && req.body.category !== "all") {
    andConditions.push({
      $or: [{ category: req.body.category }, { subject: req.body.category }]
    });
  }
  if (req.body.difficulty && req.body.difficulty !== "all") {
    andConditions.push({ difficulty: req.body.difficulty });
  }
  const match = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

  const questions = await QuestionBankItemModel.aggregate<QuestionBankItemRecord>([
    { $match: match },
    { $sample: { size: req.body.count } },
    { $project: { _id: 0 } }
  ]);

  if (questions.length > 0) {
    const ids = questions.map((q) => q.id);
    await QuestionBankItemModel.updateMany(
      { id: { $in: ids } },
      { $inc: { usageCount: 1 }, $set: { updatedAt: new Date().toISOString() } }
    );
  }

  return ok(res, questions, "Random question set generated");
}));

// POST /api/question-bank/random-paper - Legacy random paper generator
questionBankRouter.post("/random-paper", validate(randomPaperSchema), asyncHandler(async (req, res) => {
  ensureDatabase();
  checkRandomGeneratorAccess(req.user!.plan, req.user!.role);

  const andConditions: any[] = [
    {
      $or: [{ ownerId: req.user!.id }, { ownerId: "usr_demo_teacher" }, { ownerId: "system" }]
    }
  ];
  if (req.body.category && req.body.category !== "all") {
    andConditions.push({
      $or: [{ category: req.body.category }, { subject: req.body.category }]
    });
  }
  if (req.body.difficulty && req.body.difficulty !== "all") {
    andConditions.push({ difficulty: req.body.difficulty });
  }
  const match = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

  const bankItems = await QuestionBankItemModel.aggregate<QuestionBankItemRecord>([
    { $match: match },
    { $sample: { size: req.body.count } },
    { $project: { _id: 0 } }
  ]);

  if (bankItems.length === 0) {
    throw new ApiError(400, `No questions found in Question Bank matching category "${req.body.category}". Add some questions first.`);
  }

  const paperQuestions = bankItems.map((item, idx) => ({
    id: `q_${nanoid(10)}`,
    number: `${idx + 1}`,
    title: item.title,
    subtitle: item.subtitle || undefined,
    imageUrl: item.imageUrl || undefined,
    marks: item.marks || 1,
    explanation: item.explanation || undefined,
    type: (item.type || "mcq") as "mcq" | "cq",
    options: (item.options || []).map((optText, optIndex) => ({
      id: `opt_${nanoid(8)}`,
      label: String.fromCharCode(65 + optIndex),
      text: optText,
      isCorrect: optIndex === item.correctIndex
    })),
    subQuestions: item.subQuestions
  }));

  const totalMarks = paperQuestions.reduce((sum, q) => sum + q.marks, 0);

  const createdPaper = await createPaper(req.user!.id, req.user!.plan, {
    name: req.body.name,
    subject: req.body.category,
    className: req.body.className,
    examType: req.body.examType,
    duration: req.body.duration,
    totalMarks,
    instructions: req.body.instructions || "Choose the best answer for each question. All questions carry equal marks.",
    questionNumberStyle: "numeric",
    optionLabelStyle: "upper-alpha",
    questionsPerPage: 10,
    layout: req.body.layout
  }, req);

  const finalizedPaper = await updatePaperQuestions(createdPaper.id, req.user!.id, req.user!.plan, paperQuestions as any);

  await QuestionBankItemModel.updateMany(
    { id: { $in: bankItems.map((item) => item.id) } },
    { $inc: { usageCount: 1 }, $set: { updatedAt: new Date().toISOString() } }
  );

  return ok(res, finalizedPaper, `Generated paper "${finalizedPaper.name}" with ${paperQuestions.length} questions from Question Bank`, 201);
}));

// POST /api/question-bank/import-json (Admin only)
questionBankRouter.post("/import-json", asyncHandler(async (req, res) => {
  if (req.user?.role !== "admin") {
    throw new ApiError(403, "Administrator privilege required to import questions into the system Question Bank.");
  }
  const query = req.query as Record<string, string | undefined>;
  const payload = req.body;
  const isWrapper = typeof payload === "object" && !Array.isArray(payload);

  const options = {
    ownerId: query.ownerId || (isWrapper ? payload.ownerId : undefined) || "system",
    classId: query.classId || (isWrapper ? payload.classId : undefined),
    subjectId: query.subjectId || (isWrapper ? payload.subjectId : undefined),
    chapterId: query.chapterId || (isWrapper ? payload.chapterId : undefined),
    className: query.className || (isWrapper ? payload.className || payload.defaultClassName : undefined),
    subject: query.subject || (isWrapper ? payload.subject || payload.defaultSubject : undefined),
    chapter: query.chapter || (isWrapper ? payload.chapter || payload.defaultChapter : undefined),
    defaultClassName: query.className || (isWrapper ? payload.defaultClassName || payload.className : undefined),
    defaultSubject: query.subject || (isWrapper ? payload.defaultSubject || payload.subject : undefined),
    defaultChapter: query.chapter || (isWrapper ? payload.defaultChapter || payload.chapter : undefined),
    defaultBoard: query.board || (isWrapper ? payload.defaultBoard || payload.board : undefined),
    defaultYear: query.year || (isWrapper ? payload.defaultYear || payload.year : undefined),
    defaultDifficulty: (query.difficulty as any) || (isWrapper ? payload.defaultDifficulty || payload.difficulty : undefined),
    defaultNature: (query.nature as any) || (isWrapper ? payload.defaultNature || payload.nature : undefined),
    mode: (query.mode as any) || (isWrapper ? payload.mode : undefined),
    skipDuplicates: query.skipDuplicates !== undefined ? query.skipDuplicates === "true" : (isWrapper ? payload.skipDuplicates : undefined),
    updateExisting: query.updateExisting !== undefined ? query.updateExisting === "true" : (isWrapper ? payload.updateExisting : undefined)
  };

  const summary = await importQuestionsFromJson(payload, options);
  return ok(res, summary, `Successfully processed ${summary.totalReceived} questions`, 201);
}));

