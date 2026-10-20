import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { ApiError, asyncHandler, ok, validate } from "../../utils/http.js";
import { SupportTicketModel } from "./support.models.js";
import { UserModel } from "../auth/auth.models.js";

const createTicketSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  category: z.enum(["billing", "paper_generation", "math_formatting", "feature_request", "general"]).default("general"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  message: z.string().optional(),
  description: z.string().optional()
});

const replySchema = z.object({
  message: z.string().min(1, "Reply message cannot be empty"),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional()
});

const statusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"])
});

export const supportRouter = Router();

supportRouter.use(requireAuth);

// GET /api/support/tickets - list tickets (admin gets all, user gets own)
supportRouter.get(
  "/tickets",
  asyncHandler(async (req, res) => {
    const isAdmin = req.user!.role === "admin";
    const filter = isAdmin ? {} : { userId: req.user!.id };

    const tickets = await SupportTicketModel.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = tickets.map((t) => ({
      id: t.id,
      userId: t.userId,
      userName: t.userName,
      userEmail: t.userEmail,
      subject: t.subject,
      category: t.category,
      priority: t.priority,
      status: t.status,
      replies: Math.max(0, (t.messages || []).length - 1),
      lastMessage: t.messages?.[t.messages.length - 1]?.message || "",
      messages: t.messages || [],
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }));

    return ok(res, formatted);
  })
);

// GET /api/support/tickets/:id - get full ticket details and thread
supportRouter.get(
  "/tickets/:id",
  asyncHandler(async (req, res) => {
    const ticket = await SupportTicketModel.findOne({ id: req.params.id }).lean();
    if (!ticket) {
      throw new ApiError(404, "Support ticket not found");
    }

    const isAdmin = req.user!.role === "admin";
    if (!isAdmin && ticket.userId !== req.user!.id) {
      throw new ApiError(403, "You do not have permission to view this ticket");
    }

    return ok(res, ticket);
  })
);

// POST /api/support/tickets - create a new ticket
supportRouter.post(
  "/tickets",
  validate(createTicketSchema),
  asyncHandler(async (req, res) => {
    const ticketId = `tkt_${nanoid(10)}`;
    const now = new Date();

    const userRecord = await UserModel.findOne({ id: req.user!.id }).lean();
    const userName = req.user!.name || userRecord?.name || "User";
    const userEmail = req.user!.email || userRecord?.email || "user@example.com";

    const messageText = (req.body.message || req.body.description || "").trim();
    if (!messageText) {
      throw new ApiError(400, "Message or description cannot be empty");
    }

    const firstMessage = {
      id: `msg_${nanoid(8)}`,
      senderId: req.user!.id,
      senderName: userName,
      senderRole: (req.user!.role === "admin" ? "admin" : "user") as "user" | "admin",
      message: messageText,
      createdAt: now
    };

    const newTicket = await SupportTicketModel.create({
      id: ticketId,
      userId: req.user!.id,
      userName,
      userEmail,
      subject: req.body.subject,
      category: req.body.category,
      priority: req.body.priority,
      status: "open",
      messages: [firstMessage],
      createdAt: now,
      updatedAt: now
    });

    return ok(res, newTicket, "Support ticket created successfully", 201);
  })
);

// POST /api/support/tickets/:id/replies - reply to a ticket
supportRouter.post(
  "/tickets/:id/replies",
  validate(replySchema),
  asyncHandler(async (req, res) => {
    const ticket = await SupportTicketModel.findOne({ id: req.params.id });
    if (!ticket) {
      throw new ApiError(404, "Support ticket not found");
    }

    const isAdmin = req.user!.role === "admin";
    if (!isAdmin && ticket.userId !== req.user!.id) {
      throw new ApiError(403, "You do not have permission to reply to this ticket");
    }

    const userRecord = await UserModel.findOne({ id: req.user!.id }).lean();
    const senderName = req.user!.name || userRecord?.name || (isAdmin ? "Administrator" : "User");

    const newMessage = {
      id: `msg_${nanoid(8)}`,
      senderId: req.user!.id,
      senderName,
      senderRole: (isAdmin ? "admin" : "user") as "user" | "admin",
      message: req.body.message,
      createdAt: new Date()
    };

    ticket.messages.push(newMessage as any);

    if (req.body.status) {
      ticket.status = req.body.status;
    } else if (isAdmin && ticket.status === "open") {
      ticket.status = "in_progress";
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    return ok(res, ticket, "Reply submitted successfully");
  })
);

// PATCH /api/support/tickets/:id/status - update ticket status
supportRouter.patch(
  "/tickets/:id/status",
  validate(statusSchema),
  asyncHandler(async (req, res) => {
    const ticket = await SupportTicketModel.findOne({ id: req.params.id });
    if (!ticket) {
      throw new ApiError(404, "Support ticket not found");
    }

    const isAdmin = req.user!.role === "admin";
    if (!isAdmin && ticket.userId !== req.user!.id) {
      throw new ApiError(403, "You do not have permission to modify this ticket");
    }

    ticket.status = req.body.status;
    ticket.updatedAt = new Date();
    await ticket.save();

    return ok(res, ticket, `Ticket marked as ${req.body.status}`);
  })
);

