import mongoose, { Schema, type Document, type Model } from "mongoose";

export type TicketCategory = "billing" | "paper_generation" | "math_formatting" | "feature_request" | "general";
export type TicketPriority = "low" | "medium" | "high";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type TicketMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "user" | "admin";
  message: string;
  createdAt: Date;
};

export type SupportTicketRecord = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: Date;
  updatedAt: Date;
};

export type SupportTicketDocument = Document & SupportTicketRecord;

const ticketMessageSchema = new Schema<TicketMessage>(
  {
    id: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ["user", "admin"], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const supportTicketSchema = new Schema<SupportTicketDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    subject: { type: String, required: true },
    category: {
      type: String,
      enum: ["billing", "paper_generation", "math_formatting", "feature_request", "general"],
      default: "general"
    },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open", index: true },
    messages: { type: [ticketMessageSchema], default: [] }
  },
  { timestamps: true }
);

export const SupportTicketModel: Model<SupportTicketDocument> =
  (mongoose.models.SupportTicket as Model<SupportTicketDocument>) ||
  mongoose.model<SupportTicketDocument>("SupportTicket", supportTicketSchema);
