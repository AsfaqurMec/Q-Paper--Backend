import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.middleware.js";
import { ApiError, asyncHandler, ok, validate } from "../../utils/http.js";
import { importQuestionsFromJson } from "../question-bank/questionBank.importer.js";
import { curriculumRouter } from "../curriculum/curriculum.routes.js";
import {
  getAllPaymentOptions,
  createPaymentOption,
  updatePaymentOption,
  deletePaymentOption,
  getAdminPaymentRequests,
  getAdminPaymentRequestById,
  approvePaymentRequest,
  rejectPaymentRequest
} from "../billing/billing.service.js";
import {
  getAdminDashboardStats,
  getAdminUsersList,
  updateUserPlan,
  updateUserRole,
  deleteUser,
  getAdminPapersList,
  deleteAdminPaper,
  getAdminTicketsList,
  replyAdminTicket,
  updateAdminTicketStatus,
  getAdminSystemDiagnostics
} from "./admin.service.js";

const updatePlanSchema = z.object({
  plan: z.enum(["free", "small", "pro", "ultra", "diamond", "standard"])
});

const updateRoleSchema = z.object({
  role: z.enum(["user", "admin"])
});

const adminReplySchema = z.object({
  message: z.string().min(1, "Reply message cannot be empty"),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional()
});

const createPaymentOptionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  number: z.string().min(1, "Number is required"),
  instruction: z.string().optional(),
  isActive: z.boolean().optional()
});

const updatePaymentOptionSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().min(1).optional(),
  number: z.string().min(1).optional(),
  instruction: z.string().optional(),
  isActive: z.boolean().optional()
});

const approvePaymentRequestSchema = z.object({
  note: z.string().optional()
});

const rejectPaymentRequestSchema = z.object({
  reason: z.string().optional()
});

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));
adminRouter.use("/curriculum", curriculumRouter);

// GET /api/admin/dashboard - live aggregated statistics from MongoDB & system runtime
adminRouter.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const data = await getAdminDashboardStats();
    return ok(res, data);
  })
);

// GET /api/admin/users - list and search all registered users
adminRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const search = req.query.search as string;
    const role = req.query.role as string;
    const plan = req.query.plan as string;
    const users = await getAdminUsersList({ search, role, plan });
    return ok(res, users);
  })
);

// PATCH /api/admin/users/:id/plan - change user subscription plan
adminRouter.patch(
  "/users/:id/plan",
  validate(updatePlanSchema),
  asyncHandler(async (req, res) => {
    const user = await updateUserPlan(req.params.id as string, req.body.plan);
    return ok(res, user, `Plan updated to ${req.body.plan}`);
  })
);

// PATCH /api/admin/users/:id/role - promote or demote user role
adminRouter.patch(
  "/users/:id/role",
  validate(updateRoleSchema),
  asyncHandler(async (req, res) => {
    const user = await updateUserRole(req.params.id as string, req.body.role);
    return ok(res, user, `Role updated to ${req.body.role}`);
  })
);

// DELETE /api/admin/users/:id - remove user from system
adminRouter.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const result = await deleteUser(req.params.id as string);
    return ok(res, result, "User deleted successfully");
  })
);

// GET /api/admin/papers - list and search papers
adminRouter.get(
  "/papers",
  asyncHandler(async (req, res) => {
    const search = req.query.search as string;
    const subject = req.query.subject as string;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = Math.max(0, parseInt(req.query.skip as string) || 0);

    const result = await getAdminPapersList({ search, subject, limit, skip });
    return ok(res, result);
  })
);

// DELETE /api/admin/papers/:id - remove paper
adminRouter.delete(
  "/papers/:id",
  asyncHandler(async (req, res) => {
    const result = await deleteAdminPaper(req.params.id as string);
    return ok(res, result, "Paper and associated share links removed successfully");
  })
);

// GET /api/admin/tickets - list support tickets
adminRouter.get(
  "/tickets",
  asyncHandler(async (_req, res) => {
    const tickets = await getAdminTicketsList();
    return ok(res, tickets);
  })
);

// POST /api/admin/tickets/:id/reply - admin reply to a ticket
adminRouter.post(
  "/tickets/:id/reply",
  validate(adminReplySchema),
  asyncHandler(async (req, res) => {
    const ticket = await replyAdminTicket(req.params.id as string, req.body.message, req.body.status);
    return ok(res, ticket, "Reply posted");
  })
);

// PATCH /api/admin/tickets/:id/status - update ticket status
adminRouter.patch(
  "/tickets/:id/status",
  validate(z.object({ status: z.enum(["open", "in_progress", "resolved", "closed"]) })),
  asyncHandler(async (req, res) => {
    const ticket = await updateAdminTicketStatus(req.params.id as string, req.body.status);
    return ok(res, ticket, `Ticket status updated to ${req.body.status}`);
  })
);

// Payment Options endpoints
adminRouter.get(
  "/payment-options",
  asyncHandler(async (_req, res) => {
    const options = await getAllPaymentOptions();
    return ok(res, options);
  })
);

adminRouter.post(
  "/payment-options",
  validate(createPaymentOptionSchema),
  asyncHandler(async (req, res) => {
    const option = await createPaymentOption(req.body);
    return ok(res, option, "Payment option created", 201);
  })
);

adminRouter.patch(
  "/payment-options/:id",
  validate(updatePaymentOptionSchema),
  asyncHandler(async (req, res) => {
    const option = await updatePaymentOption(req.params.id as string, req.body);
    return ok(res, option, "Payment option updated");
  })
);

adminRouter.delete(
  "/payment-options/:id",
  asyncHandler(async (req, res) => {
    await deletePaymentOption(req.params.id as string);
    return ok(res, null, "Payment option deleted");
  })
);

// Payment Requests endpoints
adminRouter.get(
  "/payment-requests",
  asyncHandler(async (req, res) => {
    const status = req.query.status as any;
    const requests = await getAdminPaymentRequests(status);
    return ok(res, requests);
  })
);

adminRouter.get(
  "/payment-requests/:id",
  asyncHandler(async (req, res) => {
    const request = await getAdminPaymentRequestById(req.params.id as string);
    return ok(res, request);
  })
);

adminRouter.post(
  "/payment-requests/:id/approve",
  validate(approvePaymentRequestSchema),
  asyncHandler(async (req, res) => {
    const request = await approvePaymentRequest(req.params.id as string, req.user!.id, req.body.note);
    return ok(res, request, "Payment request approved and subscription plan activated");
  })
);

adminRouter.post(
  "/payment-requests/:id/reject",
  validate(rejectPaymentRequestSchema),
  asyncHandler(async (req, res) => {
    const request = await rejectPaymentRequest(req.params.id as string, req.user!.id, req.body.reason);
    return ok(res, request, "Payment request rejected");
  })
);

// GET /api/admin/system - detailed server & database diagnostics
adminRouter.get(
  "/system",
  asyncHandler(async (_req, res) => {
    const diagnostics = await getAdminSystemDiagnostics();
    return ok(res, diagnostics);
  })
);

// POST /api/admin/question-bank/import-json & POST /api/admin/question-bank/import
const handleAdminQuestionImport = asyncHandler(async (req, res) => {
  const payload = req.body;
  if (!payload || (typeof payload === "object" && Object.keys(payload).length === 0)) {
    throw new ApiError(400, "JSON payload is empty or invalid. Please provide question data.");
  }

  const query = req.query as Record<string, string | undefined>;
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
  const message = `Successfully processed ${summary.totalReceived} question(s): ${summary.inserted} inserted, ${summary.updated} updated, ${summary.skipped} skipped${summary.errors.length ? `, ${summary.errors.length} failed` : ""}.`;

  return ok(res, summary, message, 201);
});

adminRouter.post("/question-bank/import-json", handleAdminQuestionImport);
adminRouter.post("/question-bank/import", handleAdminQuestionImport);
