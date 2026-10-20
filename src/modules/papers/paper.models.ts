import mongoose, { Schema, type Model } from "mongoose";
import type { Paper } from "../shared/types.js";

const optionSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true, default: false }
  },
  { _id: false, versionKey: false }
);

const subQuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String },
    text: { type: String, required: true },
    marks: { type: Number, required: true },
    answer: { type: String },
    explanation: { type: String }
  },
  { _id: false, versionKey: false }
);

const questionSchema = new Schema(
  {
    id: { type: String, required: true },
    number: { type: String },
    title: { type: String, required: true },
    subtitle: { type: String },
    imageUrl: { type: String },
    marks: { type: Number, required: true },
    explanation: { type: String },
    type: { type: String, enum: ["mcq", "cq"], required: true, default: "mcq" },
    options: { type: [optionSchema], default: [] },
    subQuestions: { type: [subQuestionSchema], default: undefined }
  },
  { _id: false, versionKey: false }
);

const paperSchema = new Schema<Paper>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    classId: { type: String, index: true },
    subjectId: { type: String, index: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    className: { type: String, required: true },
    examType: { type: String, required: true },
    duration: { type: String, required: true },
    totalMarks: { type: Number, required: true },
    institute: { type: String },
    instructions: { type: String },
    questionNumberStyle: { type: String, enum: ["numeric", "upper-alpha", "lower-alpha", "roman"], required: true, default: "numeric" },
    optionLabelStyle: { type: String, enum: ["upper-alpha", "bangla", "lower-alpha", "numeric"], required: true, default: "upper-alpha" },
    questionsPerPage: { type: Number, required: true, default: 10 },
    layout: { type: String, enum: ["single", "split"], required: true, default: "split" },
    cqLayout: { type: String, enum: ["single", "split"] },
    setName: { type: String },
    mcqSectionTitle: { type: String },
    cqSectionTitle: { type: String },
    status: { type: String, enum: ["draft", "published", "archived"], required: true, default: "draft", index: true },
    questions: { type: [questionSchema], default: [] },
    createdAt: { type: String, required: true },
    createdAtDate: { type: Date, default: Date.now, expires: 45 * 24 * 60 * 60 },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

paperSchema.index({ createdAtDate: 1 }, { expireAfterSeconds: 45 * 24 * 60 * 60 });

export const PaperModel =
  (mongoose.models.Paper as Model<Paper> | undefined) ??
  mongoose.model<Paper>("Paper", paperSchema, "papers");
