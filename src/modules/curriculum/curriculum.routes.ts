import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.js";
import { ApiError, asyncHandler, ok, validate } from "../../utils/http.js";
import {
  createAcademicClassSchema,
  updateAcademicClassSchema,
  createSubjectSchema,
  updateSubjectSchema,
  createChapterSchema,
  updateChapterSchema
} from "./curriculum.schemas.js";
import {
  listClasses,
  getClassDetails,
  listSubjects,
  getSubjectDetails,
  listChapters,
  getChapterDetails,
  getCurriculumTree,
  getCurriculumStats,
  getSampleQuestions,
  createAcademicClass,
  updateAcademicClass,
  deleteAcademicClass,
  createSubject,
  updateSubject,
  deleteSubject,
  createChapter,
  updateChapter,
  deleteChapter
} from "./curriculum.service.js";

export const curriculumRouter = Router();

// ==========================================
// OVERVIEW & HIERARCHY
// ==========================================

curriculumRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const stats = await getCurriculumStats();
    return ok(res, stats);
  })
);

curriculumRouter.get(
  "/sample-questions",
  asyncHandler(async (req, res) => {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;
    const type = req.query.type ? String(req.query.type) : undefined;
    const subject = req.query.subject ? String(req.query.subject) : undefined;
    const samples = await getSampleQuestions({ limit, type, subject });
    return ok(res, samples);
  })
);

curriculumRouter.get(
  "/tree",
  asyncHandler(async (req, res) => {
    const onlyActive = req.query.onlyActive === "true";
    const tree = await getCurriculumTree(req.user?.id, onlyActive);
    return ok(res, tree);
  })
);


// ==========================================
// ACADEMIC CLASSES
// ==========================================

curriculumRouter.get(
  "/classes",
  asyncHandler(async (req, res) => {
    const status = req.query.status ? String(req.query.status) : undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;
    const includeCounts = req.query.includeCounts !== "false";

    const classes = await listClasses({ status, search, includeCounts });
    return ok(res, classes);
  })
);

curriculumRouter.get(
  "/classes/:id",
  asyncHandler(async (req, res) => {
    const details = await getClassDetails(String(req.params.id));
    if (!details) {
      throw new ApiError(404, "Academic class not found");
    }
    return ok(res, details);
  })
);

curriculumRouter.post(
  "/classes",
  requireAuth,
  requireRole("admin"),
  validate(createAcademicClassSchema),
  asyncHandler(async (req, res) => {
    const created = await createAcademicClass(req.body);
    return ok(res, created, "Class created successfully", 201);
  })
);

const handleUpdateClass = asyncHandler(async (req, res) => {
  const updated = await updateAcademicClass(String(req.params.id), req.body);
  if (!updated) {
    throw new ApiError(404, "Academic class not found");
  }
  return ok(res, updated, "Class updated successfully");
});

curriculumRouter.put(
  "/classes/:id",
  requireAuth,
  requireRole("admin"),
  validate(updateAcademicClassSchema),
  handleUpdateClass
);

curriculumRouter.patch(
  "/classes/:id",
  requireAuth,
  requireRole("admin"),
  validate(updateAcademicClassSchema),
  handleUpdateClass
);

curriculumRouter.delete(
  "/classes/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const force = req.query.force === "true";
    const deleted = await deleteAcademicClass(String(req.params.id), force);
    if (!deleted) {
      throw new ApiError(404, "Academic class not found");
    }
    return ok(res, { id: req.params.id }, "Class deleted successfully");
  })
);

// ==========================================
// SUBJECTS
// ==========================================

curriculumRouter.get(
  "/subjects",
  asyncHandler(async (req, res) => {
    const classId = req.query.classId ? String(req.query.classId).trim() : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;
    const includeCounts = req.query.includeCounts !== "false";

    const subjects = await listSubjects({ classId, status, search, includeCounts });
    return ok(res, subjects);
  })
);

curriculumRouter.get(
  "/subjects/:id",
  asyncHandler(async (req, res) => {
    const details = await getSubjectDetails(String(req.params.id));
    if (!details) {
      throw new ApiError(404, "Subject not found");
    }
    return ok(res, details);
  })
);

curriculumRouter.post(
  "/subjects",
  requireAuth,
  requireRole("admin"),
  validate(createSubjectSchema),
  asyncHandler(async (req, res) => {
    const created = await createSubject(req.body);
    return ok(res, created, "Subject created successfully", 201);
  })
);

const handleUpdateSubject = asyncHandler(async (req, res) => {
  const updated = await updateSubject(String(req.params.id), req.body);
  if (!updated) {
    throw new ApiError(404, "Subject not found");
  }
  return ok(res, updated, "Subject updated successfully");
});

curriculumRouter.put(
  "/subjects/:id",
  requireAuth,
  requireRole("admin"),
  validate(updateSubjectSchema),
  handleUpdateSubject
);

curriculumRouter.patch(
  "/subjects/:id",
  requireAuth,
  requireRole("admin"),
  validate(updateSubjectSchema),
  handleUpdateSubject
);

curriculumRouter.delete(
  "/subjects/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const force = req.query.force === "true";
    const deleted = await deleteSubject(String(req.params.id), force);
    if (!deleted) {
      throw new ApiError(404, "Subject not found");
    }
    return ok(res, { id: req.params.id }, "Subject deleted successfully");
  })
);

// ==========================================
// CHAPTERS
// ==========================================

curriculumRouter.get(
  "/chapters",
  asyncHandler(async (req, res) => {
    const subjectId = req.query.subjectId ? String(req.query.subjectId).trim() : undefined;
    const classId = req.query.classId ? String(req.query.classId).trim() : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const search = req.query.search ? String(req.query.search).trim() : undefined;
    const includeCounts = req.query.includeCounts !== "false";

    const chapters = await listChapters({ subjectId, classId, status, search, includeCounts });
    return ok(res, chapters);
  })
);

curriculumRouter.get(
  "/chapters/:id",
  asyncHandler(async (req, res) => {
    const details = await getChapterDetails(String(req.params.id));
    if (!details) {
      throw new ApiError(404, "Chapter not found");
    }
    return ok(res, details);
  })
);

curriculumRouter.post(
  "/chapters",
  requireAuth,
  requireRole("admin"),
  validate(createChapterSchema),
  asyncHandler(async (req, res) => {
    const created = await createChapter(req.body);
    return ok(res, created, "Chapter created successfully", 201);
  })
);

const handleUpdateChapter = asyncHandler(async (req, res) => {
  const updated = await updateChapter(String(req.params.id), req.body);
  if (!updated) {
    throw new ApiError(404, "Chapter not found");
  }
  return ok(res, updated, "Chapter updated successfully");
});

curriculumRouter.put(
  "/chapters/:id",
  requireAuth,
  requireRole("admin"),
  validate(updateChapterSchema),
  handleUpdateChapter
);

curriculumRouter.patch(
  "/chapters/:id",
  requireAuth,
  requireRole("admin"),
  validate(updateChapterSchema),
  handleUpdateChapter
);

curriculumRouter.delete(
  "/chapters/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const force = req.query.force === "true";
    const deleted = await deleteChapter(String(req.params.id), force);
    if (!deleted) {
      throw new ApiError(404, "Chapter not found");
    }
    return ok(res, { id: req.params.id }, "Chapter deleted successfully");
  })
);
