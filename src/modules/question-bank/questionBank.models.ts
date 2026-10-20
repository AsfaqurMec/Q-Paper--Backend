import mongoose, { Schema, type Model } from "mongoose";

export type BankSubQuestion = {
  id?: string;
  label: string;
  text: string;
  marks: number;
  answer?: string;
  explanation?: string;
};

export type QuestionBankItemRecord = {
  id: string;
  ownerId: string;
  classId: string;
  subjectId: string;
  chapterId: string;
  className?: string;
  subject?: string;
  chapter?: string;
  category: string;
  type: "mcq" | "cq" | "both";
  nature?: "theory" | "mathematical";
  difficulty: "easy" | "medium" | "hard";
  board?: string;
  year?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  marks?: number;
  options: string[];
  correctIndex: number;
  subQuestions?: BankSubQuestion[];
  explanation?: string;
  tags?: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

const bankSubQuestionSchema = new Schema(
  {
    id: { type: String },
    label: { type: String, required: true },
    text: { type: String, required: true },
    marks: { type: Number, required: true },
    answer: { type: String },
    explanation: { type: String }
  },
  { _id: false, versionKey: false }
);

const questionBankItemSchema = new Schema<QuestionBankItemRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    classId: { type: String, required: true, index: true },
    subjectId: { type: String, required: true, index: true },
    chapterId: { type: String, required: true, index: true },
    className: { type: String, index: true },
    subject: { type: String, index: true },
    chapter: { type: String, index: true },
    category: { type: String, required: true, index: true },
    type: { type: String, enum: ["mcq", "cq", "both"], required: true, default: "mcq", index: true },
    nature: { type: String, enum: ["theory", "mathematical"], required: true, default: "theory", index: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true, index: true },
    board: { type: String, index: true },
    year: { type: String, index: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    imageUrl: { type: String },
    marks: { type: Number, required: true, default: 1 },
    options: { type: [String], required: true, default: [] },
    correctIndex: { type: Number, required: true, default: 0 },
    subQuestions: { type: [bankSubQuestionSchema], default: undefined },
    explanation: { type: String },
    tags: { type: [String], default: [] },
    usageCount: { type: Number, required: true, default: 0 },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

questionBankItemSchema.index({ classId: 1, subjectId: 1, chapterId: 1, type: 1 });
questionBankItemSchema.index({ classId: 1, subjectId: 1, type: 1, nature: 1 });
questionBankItemSchema.index({ chapterId: 1, type: 1, nature: 1 });
questionBankItemSchema.index({ board: 1, year: 1 });
questionBankItemSchema.index({ ownerId: 1, category: 1, difficulty: 1 });
questionBankItemSchema.index({ ownerId: 1, updatedAt: -1 });
questionBankItemSchema.index({ title: "text", explanation: "text" });

export const QuestionBankItemModel =
  (mongoose.models.QuestionBankItem as Model<QuestionBankItemRecord> | undefined) ??
  mongoose.model<QuestionBankItemRecord>("QuestionBankItem", questionBankItemSchema, "question_bank_items");
