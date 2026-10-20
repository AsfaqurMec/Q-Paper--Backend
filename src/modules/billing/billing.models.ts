import mongoose, { Schema, type Document, type Model } from "mongoose";

export type PaymentOptionRecord = {
  id: string;
  title: string;
  subtitle: string;
  number: string;
  instruction?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaymentOptionDocument = Document & PaymentOptionRecord;

const paymentOptionSchema = new Schema<PaymentOptionDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, required: true, trim: true },
    number: { type: String, required: true, trim: true },
    instruction: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

export const PaymentOptionModel: Model<PaymentOptionDocument> =
  (mongoose.models.PaymentOption as Model<PaymentOptionDocument>) ||
  mongoose.model<PaymentOptionDocument>("PaymentOption", paymentOptionSchema, "payment_options");

export type PaymentRequestStatus = "pending" | "approved" | "rejected";

export type PaymentRequestRecord = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  planCode: "small" | "pro" | "ultra" | "diamond" | "standard";
  planName: string;
  amount: number;
  paymentOptionId: string;
  paymentOptionTitle: string;
  paymentOptionSubtitle: string;
  paymentOptionNumber: string;
  transactionId: string;
  senderNumber?: string;
  customerNote?: string;
  status: PaymentRequestStatus;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type PaymentRequestDocument = Document & PaymentRequestRecord;

const paymentRequestSchema = new Schema<PaymentRequestDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true, lowercase: true, trim: true },
    userPhone: { type: String, default: "" },
    planCode: { type: String, enum: ["small", "pro", "ultra", "diamond", "standard"], required: true },
    planName: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentOptionId: { type: String, required: true },
    paymentOptionTitle: { type: String, required: true },
    paymentOptionSubtitle: { type: String, required: true },
    paymentOptionNumber: { type: String, required: true },
    transactionId: { type: String, required: true, trim: true, index: true },
    senderNumber: { type: String, default: "" },
    customerNote: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    adminNote: { type: String, default: "" },
    reviewedBy: { type: String },
    reviewedAt: { type: String }
  },
  { timestamps: true }
);

export const PaymentRequestModel: Model<PaymentRequestDocument> =
  (mongoose.models.PaymentRequest as Model<PaymentRequestDocument>) ||
  mongoose.model<PaymentRequestDocument>("PaymentRequest", paymentRequestSchema, "payment_requests");
