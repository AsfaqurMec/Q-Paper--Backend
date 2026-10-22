import mongoose, { type Model, Schema } from "mongoose";
import type { Plan } from "./plan.service.js";

export interface PlanRecord extends Plan {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

const planSchema = new Schema<PlanRecord>(
  {
    id: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    interval: { type: String, default: "month" },
    duration: { type: String, default: "৩০ দিন" },
    durationDays: { type: Number, default: 30 },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    paperLimit: { type: Number, required: true },
    questionLimit: { type: Number, required: true },
    totalQuestionsLimit: { type: Number, required: true },
    exports: [{ type: String }],
    importQuestion: { type: Boolean, default: false },
    watermark: { type: Boolean, default: false },
    questionBank: { type: Boolean, default: true },
    branding: { type: Boolean, default: true },
    randomGenerator: { type: Boolean, default: true },
    multipleVersions: { type: Boolean, default: true },
    createdAt: { type: String },
    updatedAt: { type: String }
  },
  {
    versionKey: false,
    timestamps: false
  }
);

export const PlanModel =
  (mongoose.models.Plan as Model<PlanRecord> | undefined) ??
  mongoose.model<PlanRecord>("Plan", planSchema, "plans");
