import mongoose, { Schema, type Model } from "mongoose";

export type AcademicClassRecord = {
  id: string;
  name: string;
  code: string;
  aliases: string[];
  order: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type SubjectRecord = {
  id: string;
  classId: string;
  name: string;
  code: string;
  category: string;
  aliases: string[];
  order: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type ChapterRecord = {
  id: string;
  classId: string;
  subjectId: string;
  chapterNumber: number;
  name: string;
  aliases?: string[];
  order: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

const academicClassSchema = new Schema<AcademicClassRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    code: { type: String, required: true, index: true },
    aliases: { type: [String], default: [] },
    order: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

const subjectSchema = new Schema<SubjectRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    classId: { type: String, required: true, index: true },
    name: { type: String, required: true, index: true },
    code: { type: String, required: true, index: true },
    category: { type: String, required: true, default: "General", index: true },
    aliases: { type: [String], default: [] },
    order: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

subjectSchema.index({ classId: 1, name: 1 });
subjectSchema.index({ classId: 1, order: 1 });

const chapterSchema = new Schema<ChapterRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    classId: { type: String, required: true, index: true },
    subjectId: { type: String, required: true, index: true },
    chapterNumber: { type: Number, required: true, default: 1 },
    name: { type: String, required: true, index: true },
    aliases: { type: [String], default: [] },
    order: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

chapterSchema.index({ subjectId: 1, chapterNumber: 1 });
chapterSchema.index({ subjectId: 1, order: 1 });
chapterSchema.index({ classId: 1, subjectId: 1 });

export const AcademicClassModel =
  (mongoose.models.AcademicClass as Model<AcademicClassRecord> | undefined) ??
  mongoose.model<AcademicClassRecord>("AcademicClass", academicClassSchema, "academic_classes");

export const SubjectModel =
  (mongoose.models.Subject as Model<SubjectRecord> | undefined) ??
  mongoose.model<SubjectRecord>("Subject", subjectSchema, "subjects");

export const ChapterModel =
  (mongoose.models.Chapter as Model<ChapterRecord> | undefined) ??
  mongoose.model<ChapterRecord>("Chapter", chapterSchema, "chapters");
