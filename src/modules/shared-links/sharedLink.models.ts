import mongoose, { Schema, type Document, type Model } from "mongoose";

export type SharedLinkRecord = {
  id: string;
  token: string;
  paperId: string;
  userId: string;
  paperName: string;
  subject: string;
  className: string;
  mode: "view_only" | "download_pdf";
  isProtected: boolean;
  passwordHash?: string;
  visits: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type SharedLinkDocument = Document & SharedLinkRecord;

const sharedLinkSchema = new Schema<SharedLinkDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    paperId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    paperName: { type: String, required: true },
    subject: { type: String, default: "General" },
    className: { type: String, default: "HSC" },
    mode: { type: String, enum: ["view_only", "download_pdf"], default: "view_only" },
    isProtected: { type: Boolean, default: false },
    passwordHash: { type: String },
    visits: { type: Number, default: 0 },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

export const SharedLinkModel: Model<SharedLinkDocument> =
  (mongoose.models.SharedLink as Model<SharedLinkDocument>) ||
  mongoose.model<SharedLinkDocument>("SharedLink", sharedLinkSchema);
