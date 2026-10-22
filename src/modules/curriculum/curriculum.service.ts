import { nanoid } from "nanoid";
import { ApiError } from "../../utils/http.js";
import {
  AcademicClassModel,
  SubjectModel,
  ChapterModel,
  type AcademicClassRecord,
  type SubjectRecord,
  type ChapterRecord
} from "./curriculum.models.js";
import { QuestionBankItemModel } from "../question-bank/questionBank.models.js";
import { getBengaliClass, getBengaliSubject, getBengaliChapter } from "./curriculumBengali.js";

export type ListClassesOptions = {
  status?: "active" | "inactive" | "all" | string;
  search?: string;
  includeCounts?: boolean;
};

export async function listClasses(
  optionsOrOnlyActive: ListClassesOptions | boolean = true
): Promise<Array<AcademicClassRecord & { subjectsCount?: number; chaptersCount?: number; questionsCount?: number }>> {
  const options: ListClassesOptions =
    typeof optionsOrOnlyActive === "boolean"
      ? { status: optionsOrOnlyActive ? "active" : "all", includeCounts: true }
      : { includeCounts: true, ...optionsOrOnlyActive };

  const query: any = {};
  if (options.status && options.status !== "all") {
    query.status = options.status;
  }
  if (options.search?.trim()) {
    const searchRegex = new RegExp(options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: searchRegex }, { code: searchRegex }, { aliases: searchRegex }];
  }

  const classes = await AcademicClassModel.find(query).sort({ order: 1, name: 1 }).lean();

  if (!options.includeCounts || classes.length === 0) {
    return classes;
  }

  const classIds = classes.map((c) => c.id);

  const [subjectCounts, chapterCounts, questionCounts] = await Promise.all([
    SubjectModel.aggregate([
      { $match: { classId: { $in: classIds } } },
      { $group: { _id: "$classId", count: { $sum: 1 } } }
    ]),
    ChapterModel.aggregate([
      { $match: { classId: { $in: classIds } } },
      { $group: { _id: "$classId", count: { $sum: 1 } } }
    ]),
    QuestionBankItemModel.aggregate([
      { $match: { classId: { $in: classIds } } },
      { $group: { _id: "$classId", count: { $sum: 1 } } }
    ])
  ]);

  const subjMap = new Map<string, number>(subjectCounts.map((s) => [s._id, s.count]));
  const chapMap = new Map<string, number>(chapterCounts.map((ch) => [ch._id, ch.count]));
  const qMap = new Map<string, number>(questionCounts.map((q) => [q._id, q.count]));

  return classes.map((c) => ({
    ...c,
    subjectsCount: subjMap.get(c.id) || 0,
    chaptersCount: chapMap.get(c.id) || 0,
    questionsCount: qMap.get(c.id) || 0
  }));
}

export type ClassDetailsResult = AcademicClassRecord & {
  subjects: Array<SubjectRecord & { chaptersCount: number; questionsCount: number }>;
  totalSubjects: number;
  totalChapters: number;
  totalQuestions: number;
  mcqCount: number;
  cqCount: number;
};

export async function getClassDetails(id: string): Promise<ClassDetailsResult | null> {
  const cls = await AcademicClassModel.findOne({ id }).lean();
  if (!cls) return null;

  const subjects = await SubjectModel.find({ classId: id }).sort({ order: 1, name: 1 }).lean();
  const subjectIds = subjects.map((s) => s.id);

  const [chapterCounts, questionCountsPerSubject, questionTotals] = await Promise.all([
    ChapterModel.aggregate([
      { $match: { classId: id } },
      { $group: { _id: "$subjectId", count: { $sum: 1 } } }
    ]),
    QuestionBankItemModel.aggregate([
      { $match: { classId: id, subjectId: { $in: subjectIds } } },
      { $group: { _id: "$subjectId", count: { $sum: 1 } } }
    ]),
    QuestionBankItemModel.aggregate([
      { $match: { classId: id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          mcq: { $sum: { $cond: [{ $eq: ["$type", "mcq"] }, 1, 0] } },
          cq: { $sum: { $cond: [{ $eq: ["$type", "cq"] }, 1, 0] } }
        }
      }
    ])
  ]);

  const chapCountMap = new Map<string, number>(chapterCounts.map((c) => [c._id, c.count]));
  const qCountMap = new Map<string, number>(questionCountsPerSubject.map((q) => [q._id, q.count]));

  const enrichedSubjects = subjects.map((s) => ({
    ...s,
    chaptersCount: chapCountMap.get(s.id) || 0,
    questionsCount: qCountMap.get(s.id) || 0
  }));

  const totalChapters = Array.from(chapCountMap.values()).reduce((sum, n) => sum + n, 0);
  const qStats = questionTotals[0] || { total: 0, mcq: 0, cq: 0 };

  return {
    ...cls,
    subjects: enrichedSubjects,
    totalSubjects: subjects.length,
    totalChapters,
    totalQuestions: qStats.total,
    mcqCount: qStats.mcq,
    cqCount: qStats.cq
  };
}

export type ListSubjectsOptions = {
  classId?: string;
  status?: "active" | "inactive" | "all" | string;
  search?: string;
  includeCounts?: boolean;
};

export async function listSubjects(
  classIdOrOptions?: string | ListSubjectsOptions,
  onlyActiveLegacy = true
): Promise<Array<SubjectRecord & { className?: string; chaptersCount?: number; questionsCount?: number }>> {
  let options: ListSubjectsOptions = {};
  if (typeof classIdOrOptions === "string") {
    options = {
      classId: classIdOrOptions,
      status: onlyActiveLegacy ? "active" : "all",
      includeCounts: true
    };
  } else if (classIdOrOptions && typeof classIdOrOptions === "object") {
    options = { includeCounts: true, ...classIdOrOptions };
  } else {
    options = { status: onlyActiveLegacy ? "active" : "all", includeCounts: true };
  }

  const query: any = {};
  if (options.classId) {
    query.classId = options.classId;
  }
  if (options.status && options.status !== "all") {
    query.status = options.status;
  }
  if (options.search?.trim()) {
    const searchRegex = new RegExp(options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: searchRegex }, { code: searchRegex }, { category: searchRegex }, { aliases: searchRegex }];
  }

  const subjects = await SubjectModel.find(query).sort({ order: 1, name: 1 }).lean();

  if (subjects.length === 0) return [];

  const classIds = [...new Set(subjects.map((s) => s.classId))];
  const classes = await AcademicClassModel.find({ id: { $in: classIds } }).lean();
  const classMap = new Map<string, string>(classes.map((c) => [c.id, c.name]));

  if (!options.includeCounts) {
    return subjects.map((s) => ({
      ...s,
      className: classMap.get(s.classId) || ""
    }));
  }

  const subjectIds = subjects.map((s) => s.id);
  const [chapterCounts, questionCounts] = await Promise.all([
    ChapterModel.aggregate([
      { $match: { subjectId: { $in: subjectIds } } },
      { $group: { _id: "$subjectId", count: { $sum: 1 } } }
    ]),
    QuestionBankItemModel.aggregate([
      { $match: { subjectId: { $in: subjectIds } } },
      { $group: { _id: "$subjectId", count: { $sum: 1 } } }
    ])
  ]);

  const chMap = new Map<string, number>(chapterCounts.map((c) => [c._id, c.count]));
  const qMap = new Map<string, number>(questionCounts.map((q) => [q._id, q.count]));

  return subjects.map((s) => ({
    ...s,
    className: classMap.get(s.classId) || "",
    chaptersCount: chMap.get(s.id) || 0,
    questionsCount: qMap.get(s.id) || 0
  }));
}

export type SubjectDetailsResult = SubjectRecord & {
  className?: string;
  class?: AcademicClassRecord | null;
  chapters: Array<ChapterRecord & { mcqCount: number; cqCount: number; totalCount: number }>;
  totalChapters: number;
  totalQuestions: number;
  mcqCount: number;
  cqCount: number;
};

export async function getSubjectDetails(id: string): Promise<SubjectDetailsResult | null> {
  const subject = await SubjectModel.findOne({ id }).lean();
  if (!subject) return null;

  const [parentClass, chapters, questionCountsPerChapter, questionTotals] = await Promise.all([
    AcademicClassModel.findOne({ id: subject.classId }).lean(),
    ChapterModel.find({ subjectId: id }).sort({ chapterNumber: 1, order: 1, name: 1 }).lean(),
    QuestionBankItemModel.aggregate([
      { $match: { subjectId: id } },
      {
        $group: {
          _id: { chapterId: "$chapterId", type: "$type" },
          count: { $sum: 1 }
        }
      }
    ]),
    QuestionBankItemModel.aggregate([
      { $match: { subjectId: id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          mcq: { $sum: { $cond: [{ $eq: ["$type", "mcq"] }, 1, 0] } },
          cq: { $sum: { $cond: [{ $eq: ["$type", "cq"] }, 1, 0] } }
        }
      }
    ])
  ]);

  const chCountMap = new Map<string, { mcq: number; cq: number }>();
  for (const item of questionCountsPerChapter) {
    const chId = item._id.chapterId;
    if (!chId) continue;
    let entry = chCountMap.get(chId);
    if (!entry) {
      entry = { mcq: 0, cq: 0 };
      chCountMap.set(chId, entry);
    }
    if (item._id.type === "mcq") entry.mcq += item.count;
    else entry.cq += item.count;
  }

  const enrichedChapters = chapters.map((ch) => {
    const counts = chCountMap.get(ch.id) || { mcq: 0, cq: 0 };
    return {
      ...ch,
      mcqCount: counts.mcq,
      cqCount: counts.cq,
      totalCount: counts.mcq + counts.cq
    };
  });

  const qStats = questionTotals[0] || { total: 0, mcq: 0, cq: 0 };

  return {
    ...subject,
    className: parentClass?.name || "",
    class: parentClass,
    chapters: enrichedChapters,
    totalChapters: chapters.length,
    totalQuestions: qStats.total,
    mcqCount: qStats.mcq,
    cqCount: qStats.cq
  };
}

export type ListChaptersOptions = {
  subjectId?: string;
  classId?: string;
  status?: "active" | "inactive" | "all" | string;
  search?: string;
  includeCounts?: boolean;
};

export async function listChapters(
  subjectIdOrOptions?: string | ListChaptersOptions,
  classIdLegacy?: string,
  onlyActiveLegacy = true
): Promise<Array<ChapterRecord & { subjectName?: string; className?: string; mcqCount?: number; cqCount?: number; totalCount?: number }>> {
  let options: ListChaptersOptions = {};
  if (typeof subjectIdOrOptions === "string") {
    options = {
      subjectId: subjectIdOrOptions,
      classId: classIdLegacy,
      status: onlyActiveLegacy ? "active" : "all",
      includeCounts: true
    };
  } else if (subjectIdOrOptions && typeof subjectIdOrOptions === "object") {
    options = { includeCounts: true, ...subjectIdOrOptions };
  } else {
    options = { status: onlyActiveLegacy ? "active" : "all", includeCounts: true };
  }

  const query: any = {};
  if (options.subjectId) query.subjectId = options.subjectId;
  if (options.classId) query.classId = options.classId;
  if (options.status && options.status !== "all") {
    query.status = options.status;
  }
  if (options.search?.trim()) {
    const searchRegex = new RegExp(options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: searchRegex }, { aliases: searchRegex }];
  }

  const chapters = await ChapterModel.find(query).sort({ chapterNumber: 1, order: 1, name: 1 }).lean();

  if (chapters.length === 0) return [];

  const subjectIds = [...new Set(chapters.map((ch) => ch.subjectId))];
  const classIds = [...new Set(chapters.map((ch) => ch.classId))];

  const [subjects, classes] = await Promise.all([
    SubjectModel.find({ id: { $in: subjectIds } }).lean(),
    AcademicClassModel.find({ id: { $in: classIds } }).lean()
  ]);

  const subjectMap = new Map<string, string>(subjects.map((s) => [s.id, s.name]));
  const classMap = new Map<string, string>(classes.map((c) => [c.id, c.name]));

  if (!options.includeCounts) {
    return chapters.map((ch) => ({
      ...ch,
      subjectName: subjectMap.get(ch.subjectId) || "",
      className: classMap.get(ch.classId) || ""
    }));
  }

  const chapterIds = chapters.map((ch) => ch.id);
  const counts = await QuestionBankItemModel.aggregate([
    { $match: { chapterId: { $in: chapterIds } } },
    {
      $group: {
        _id: { chapterId: "$chapterId", type: "$type" },
        count: { $sum: 1 }
      }
    }
  ]);

  const countMap = new Map<string, { mcq: number; cq: number }>();
  for (const c of counts) {
    const chId = c._id.chapterId;
    if (!chId) continue;
    let entry = countMap.get(chId);
    if (!entry) {
      entry = { mcq: 0, cq: 0 };
      countMap.set(chId, entry);
    }
    if (c._id.type === "mcq") entry.mcq += c.count;
    else entry.cq += c.count;
  }

  return chapters.map((ch) => {
    const c = countMap.get(ch.id) || { mcq: 0, cq: 0 };
    return {
      ...ch,
      subjectName: subjectMap.get(ch.subjectId) || "",
      className: classMap.get(ch.classId) || "",
      mcqCount: c.mcq,
      cqCount: c.cq,
      totalCount: c.mcq + c.cq
    };
  });
}

export type ChapterDetailsResult = ChapterRecord & {
  subjectName?: string;
  className?: string;
  subject?: SubjectRecord | null;
  class?: AcademicClassRecord | null;
  mcqCount: number;
  cqCount: number;
  totalQuestions: number;
  sampleQuestions: Array<{ id: string; title: string; type?: string; difficulty?: string }>;
};

export async function getChapterDetails(id: string): Promise<ChapterDetailsResult | null> {
  const chapter = await ChapterModel.findOne({ id }).lean();
  if (!chapter) return null;

  const [subject, parentClass, questionCounts, sampleQuestions] = await Promise.all([
    SubjectModel.findOne({ id: chapter.subjectId }).lean(),
    AcademicClassModel.findOne({ id: chapter.classId }).lean(),
    QuestionBankItemModel.aggregate([
      { $match: { chapterId: id } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 }
        }
      }
    ]),
    QuestionBankItemModel.find({ chapterId: id })
      .select("id title type difficulty")
      .limit(6)
      .lean()
  ]);

  const mcq = questionCounts.find((q) => q._id === "mcq")?.count || 0;
  const cq = questionCounts.find((q) => q._id === "cq")?.count || 0;

  return {
    ...chapter,
    subjectName: subject?.name || "",
    className: parentClass?.name || "",
    subject,
    class: parentClass,
    mcqCount: mcq,
    cqCount: cq,
    totalQuestions: mcq + cq,
    sampleQuestions: sampleQuestions as any
  };
}

export async function getCurriculumStats() {
  const [
    totalClasses,
    activeClasses,
    totalSubjects,
    activeSubjects,
    totalChapters,
    activeChapters,
    totalQuestions,
    linkedQuestions
  ] = await Promise.all([
    AcademicClassModel.countDocuments(),
    AcademicClassModel.countDocuments({ status: "active" }),
    SubjectModel.countDocuments(),
    SubjectModel.countDocuments({ status: "active" }),
    ChapterModel.countDocuments(),
    ChapterModel.countDocuments({ status: "active" }),
    QuestionBankItemModel.countDocuments(),
    QuestionBankItemModel.countDocuments({
      classId: { $exists: true, $ne: null },
      subjectId: { $exists: true, $ne: null },
      chapterId: { $exists: true, $ne: null }
    })
  ]);

  return {
    totalClasses,
    activeClasses,
    totalSubjects,
    activeSubjects,
    totalChapters,
    activeChapters,
    totalQuestions,
    linkedQuestions
  };
}

export type ChapterTreeNode = {
  id: string;
  classId: string;
  subjectId: string;
  chapterNumber: number;
  name: string;
  nameBn?: string;
  order: number;
  mcqCount: number;
  cqCount: number;
  totalCount: number;
};

export type SubjectTreeNode = {
  id: string;
  classId: string;
  name: string;
  nameBn?: string;
  code: string;
  category: string;
  order: number;
  mcqCount: number;
  cqCount: number;
  totalCount: number;
  chapters: ChapterTreeNode[];
};

export type ClassTreeNode = {
  id: string;
  className: string;
  nameBn?: string;
  code: string;
  order: number;
  mcqCount: number;
  cqCount: number;
  totalCount: number;
  subjects: SubjectTreeNode[];
};

export async function getCurriculumTree(ownerId?: string, onlyActive = false): Promise<ClassTreeNode[]> {
  const filter = onlyActive ? { status: "active" } : {};
  const [classes, subjects, chapters] = await Promise.all([
    AcademicClassModel.find(filter).sort({ order: 1, name: 1 }).lean(),
    SubjectModel.find(filter).sort({ order: 1, name: 1 }).lean(),
    ChapterModel.find(filter).sort({ chapterNumber: 1, order: 1, name: 1 }).lean()
  ]);

  const matchFilter: any = {
    $or: [{ ownerId: "system" }, { ownerId: "usr_demo_teacher" }]
  };
  if (ownerId) {
    matchFilter.$or.push({ ownerId });
  }

  const counts = await QuestionBankItemModel.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          chapterId: "$chapterId",
          type: "$type"
        },
        count: { $sum: 1 }
      }
    }
  ]);

  const chapterCounts = new Map<string, { mcq: number; cq: number }>();
  for (const c of counts) {
    const chId = c._id.chapterId;
    if (!chId) continue;
    let entry = chapterCounts.get(chId);
    if (!entry) {
      entry = { mcq: 0, cq: 0 };
      chapterCounts.set(chId, entry);
    }
    if (c._id.type === "mcq") {
      entry.mcq += c.count;
    } else {
      entry.cq += c.count;
    }
  }

  const subjectMap = new Map<string, SubjectTreeNode>();
  for (const s of subjects) {
    subjectMap.set(s.id, {
      id: s.id,
      classId: s.classId,
      name: s.name,
      nameBn: s.nameBn || getBengaliSubject(s.name),
      code: s.code,
      category: s.category,
      order: s.order,
      mcqCount: 0,
      cqCount: 0,
      totalCount: 0,
      chapters: []
    });
  }

  for (const ch of chapters) {
    const counts = chapterCounts.get(ch.id) || { mcq: 0, cq: 0 };
    const chNode: ChapterTreeNode = {
      id: ch.id,
      classId: ch.classId,
      subjectId: ch.subjectId,
      chapterNumber: ch.chapterNumber,
      name: ch.name,
      nameBn: ch.nameBn || getBengaliChapter(ch.name),
      order: ch.order,
      mcqCount: counts.mcq,
      cqCount: counts.cq,
      totalCount: counts.mcq + counts.cq
    };

    const parentSubj = subjectMap.get(ch.subjectId);
    if (parentSubj) {
      parentSubj.chapters.push(chNode);
      parentSubj.mcqCount += chNode.mcqCount;
      parentSubj.cqCount += chNode.cqCount;
      parentSubj.totalCount += chNode.totalCount;
    }
  }

  const classMap = new Map<string, ClassTreeNode>();
  for (const c of classes) {
    classMap.set(c.id, {
      id: c.id,
      className: c.name,
      nameBn: c.nameBn || getBengaliClass(c.name),
      code: c.code,
      order: c.order,
      mcqCount: 0,
      cqCount: 0,
      totalCount: 0,
      subjects: []
    });
  }

  for (const s of subjectMap.values()) {
    const parentClass = classMap.get(s.classId);
    if (parentClass) {
      parentClass.subjects.push(s);
      parentClass.mcqCount += s.mcqCount;
      parentClass.cqCount += s.cqCount;
      parentClass.totalCount += s.totalCount;
    }
  }

  return Array.from(classMap.values());
}

export async function resolveCurriculumMetadata(input: {
  classId?: string;
  subjectId?: string;
  chapterId?: string;
  className?: string;
  subject?: string;
  chapter?: string;
}): Promise<{
  classId?: string;
  subjectId?: string;
  chapterId?: string;
  className?: string;
  subject?: string;
  chapter?: string;
}> {
  let { classId, subjectId, chapterId, className, subject, chapter } = input;

  if (chapterId) {
    const ch = await ChapterModel.findOne({ id: chapterId }).lean();
    if (ch) {
      chapter = ch.name;
      subjectId = ch.subjectId;
      classId = ch.classId;
    }
  }

  if (subjectId) {
    const subj = await SubjectModel.findOne({ id: subjectId }).lean();
    if (subj) {
      subject = subj.name;
      if (!classId) classId = subj.classId;
    }
  }

  if (classId) {
    const cls = await AcademicClassModel.findOne({ id: classId }).lean();
    if (cls) {
      className = cls.name;
    }
  }

  if (!classId && className) {
    const cls = await AcademicClassModel.findOne({
      $or: [{ name: className.trim() }, { aliases: className.trim() }]
    }).lean();
    if (cls) {
      classId = cls.id;
      className = cls.name;
    }
  }

  if (!subjectId && subject) {
    const query: any = {
      $or: [{ name: subject.trim() }, { aliases: subject.trim() }]
    };
    if (classId) query.classId = classId;
    const subj = await SubjectModel.findOne(query).lean();
    if (subj) {
      subjectId = subj.id;
      subject = subj.name;
      if (!classId) classId = subj.classId;
    }
  }

  if (!chapterId && chapter) {
    const cleanChapter = chapter.trim();
    const escaped = cleanChapter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query: any = {
      $or: [{ name: cleanChapter }, { aliases: cleanChapter }, { name: { $regex: new RegExp(escaped, "i") } }]
    };
    if (subjectId) query.subjectId = subjectId;
    else if (classId) query.classId = classId;

    let ch = await ChapterModel.findOne(query).lean();

    if (!ch) {
      ch = await ChapterModel.findOne({
        $or: [{ name: cleanChapter }, { aliases: cleanChapter }, { name: { $regex: new RegExp(escaped, "i") } }]
      }).lean();
    }

    if (ch) {
      chapterId = ch.id;
      chapter = ch.name;
      if (!subjectId) subjectId = ch.subjectId;
      if (!classId) classId = ch.classId;
    } else if (subjectId && classId) {
      const count = await ChapterModel.countDocuments({ subjectId });
      const newCh = await ChapterModel.create({
        id: `ch_${nanoid(8)}`,
        classId,
        subjectId,
        chapterNumber: count + 1,
        name: cleanChapter,
        order: count + 1,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      chapterId = newCh.id;
      chapter = newCh.name;
    }
  }

  return {
    classId,
    subjectId,
    chapterId,
    className,
    subject,
    chapter
  };
}

export async function getCurriculumLookupMaps() {
  const [classes, subjects, chapters] = await Promise.all([
    AcademicClassModel.find().lean(),
    SubjectModel.find().lean(),
    ChapterModel.find().lean()
  ]);

  const classMap = new Map<string, string>();
  for (const c of classes) classMap.set(c.id, c.name);

  const subjectMap = new Map<string, string>();
  for (const s of subjects) subjectMap.set(s.id, s.name);

  const chapterMap = new Map<string, { name: string; chapterNumber: number }>();
  for (const ch of chapters) chapterMap.set(ch.id, { name: ch.name, chapterNumber: ch.chapterNumber });

  return { classMap, subjectMap, chapterMap };
}

export async function enrichQuestionsWithCurriculum<T extends { classId?: string; subjectId?: string; chapterId?: string }>(
  questions: T[]
): Promise<(T & { className: string; subject: string; chapter: string })[]> {
  if (!questions.length) return [];
  const { classMap, subjectMap, chapterMap } = await getCurriculumLookupMaps();

  return questions.map((q) => {
    const chInfo = q.chapterId ? chapterMap.get(q.chapterId) : undefined;
    return {
      ...q,
      className: (q.classId ? classMap.get(q.classId) : "") || "",
      subject: (q.subjectId ? subjectMap.get(q.subjectId) : "") || "",
      chapter: chInfo?.name || ""
    };
  });
}

// ─── ADMIN MANAGEMENT ───────────────────────────────────────────────

export async function createAcademicClass(data: any): Promise<AcademicClassRecord> {
  const timestamp = new Date().toISOString();
  const id = data.id || `cls_${nanoid(8)}`;

  // Check if class with same code already exists
  const existing = await AcademicClassModel.findOne({
    $or: [{ id }, { code: String(data.code).trim().toUpperCase() }]
  }).lean();
  if (existing) {
    throw new ApiError(409, `Class with code "${data.code}" already exists`);
  }

  return AcademicClassModel.create({
    ...data,
    id,
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

export async function updateAcademicClass(id: string, data: any): Promise<AcademicClassRecord | null> {
  if (data.code) {
    const duplicate = await AcademicClassModel.findOne({
      id: { $ne: id },
      code: String(data.code).trim().toUpperCase()
    }).lean();
    if (duplicate) {
      throw new ApiError(409, `Class with code "${data.code}" already exists`);
    }
  }

  return AcademicClassModel.findOneAndUpdate(
    { id },
    { $set: { ...data, updatedAt: new Date().toISOString() } },
    { new: true }
  ).lean();
}

export async function deleteAcademicClass(id: string, force = false): Promise<boolean> {
  if (!force) {
    const [subCount, qCount] = await Promise.all([
      SubjectModel.countDocuments({ classId: id }),
      QuestionBankItemModel.countDocuments({ classId: id })
    ]);
    if (subCount > 0 || qCount > 0) {
      throw new ApiError(
        400,
        `Cannot delete class. It still has ${subCount} subject(s) and ${qCount} question(s) associated with it. Please reassign or delete them first, or use force delete.`
      );
    }
  }

  const result = await AcademicClassModel.deleteOne({ id });
  return (result.deletedCount ?? 0) > 0;
}

export async function createSubject(data: any): Promise<SubjectRecord> {
  const parentClass = await AcademicClassModel.findOne({ id: data.classId }).lean();
  if (!parentClass) {
    throw new ApiError(404, `Class with ID "${data.classId}" does not exist`);
  }

  // Check duplicate subject name in same class
  const existing = await SubjectModel.findOne({
    classId: data.classId,
    name: { $regex: new RegExp(`^${data.name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }
  }).lean();
  if (existing) {
    throw new ApiError(409, `Subject "${data.name}" already exists in ${parentClass.name}`);
  }

  const timestamp = new Date().toISOString();
  const id = data.id || `subj_${nanoid(8)}`;
  return SubjectModel.create({
    ...data,
    id,
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

export async function updateSubject(id: string, data: any): Promise<SubjectRecord | null> {
  if (data.classId) {
    const parentClass = await AcademicClassModel.findOne({ id: data.classId }).lean();
    if (!parentClass) {
      throw new ApiError(404, `Target Class with ID "${data.classId}" does not exist`);
    }
  }

  return SubjectModel.findOneAndUpdate(
    { id },
    { $set: { ...data, updatedAt: new Date().toISOString() } },
    { new: true }
  ).lean();
}

export async function deleteSubject(id: string, force = false): Promise<boolean> {
  if (!force) {
    const [chapCount, qCount] = await Promise.all([
      ChapterModel.countDocuments({ subjectId: id }),
      QuestionBankItemModel.countDocuments({ subjectId: id })
    ]);
    if (chapCount > 0 || qCount > 0) {
      throw new ApiError(
        400,
        `Cannot delete subject. It still has ${chapCount} chapter(s) and ${qCount} question(s) associated with it.`
      );
    }
  }

  const result = await SubjectModel.deleteOne({ id });
  return (result.deletedCount ?? 0) > 0;
}

export async function createChapter(data: any): Promise<ChapterRecord> {
  const parentSubj = await SubjectModel.findOne({ id: data.subjectId }).lean();
  if (!parentSubj) {
    throw new ApiError(404, `Subject with ID "${data.subjectId}" does not exist`);
  }

  const classId = data.classId || parentSubj.classId;

  // Auto-calculate chapterNumber if not provided or 0
  let chapterNumber = data.chapterNumber;
  if (!chapterNumber || chapterNumber < 1) {
    const lastChapter = await ChapterModel.findOne({ subjectId: data.subjectId }).sort({ chapterNumber: -1 }).lean();
    chapterNumber = (lastChapter?.chapterNumber || 0) + 1;
  }

  const timestamp = new Date().toISOString();
  const id = data.id || `chap_${nanoid(8)}`;

  return ChapterModel.create({
    ...data,
    classId,
    chapterNumber,
    id,
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

export async function updateChapter(id: string, data: any): Promise<ChapterRecord | null> {
  if (data.subjectId) {
    const parentSubj = await SubjectModel.findOne({ id: data.subjectId }).lean();
    if (!parentSubj) {
      throw new ApiError(404, `Target Subject with ID "${data.subjectId}" does not exist`);
    }
    if (!data.classId) {
      data.classId = parentSubj.classId;
    }
  }

  return ChapterModel.findOneAndUpdate(
    { id },
    { $set: { ...data, updatedAt: new Date().toISOString() } },
    { new: true }
  ).lean();
}

export async function deleteChapter(id: string, force = false): Promise<boolean> {
  if (!force) {
    const qCount = await QuestionBankItemModel.countDocuments({ chapterId: id });
    if (qCount > 0) {
      throw new ApiError(
        400,
        `Cannot delete chapter. It has ${qCount} question(s) linked to it in the question bank.`
      );
    }
  }

  const result = await ChapterModel.deleteOne({ id });
  return (result.deletedCount ?? 0) > 0;
}

export async function getSampleQuestions(options: { limit?: number; type?: string; subject?: string } = {}) {
  const limit = Math.min(options.limit || 10, 50);
  const query: any = {};
  if (options.type) {
    query.type = options.type;
  }
  if (options.subject) {
    query.$or = [
      { subject: new RegExp(options.subject, "i") },
      { category: new RegExp(options.subject, "i") }
    ];
  }
  return QuestionBankItemModel.find(query)
    .select("id title type subject category className chapter options correctIndex subQuestions board year difficulty marks")
    .limit(limit)
    .lean();
}

