import { nanoid } from "nanoid";
import mongoose from "mongoose";
import type { Request } from "express";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/http.js";
import { assertWithinPlan, getPlan } from "../plans/plan.service.js";
import { checkDeviceFreeLimit, recordDevicePaperCreation } from "../device/device.service.js";
import type { Paper, PlanCode, Question } from "../shared/types.js";
import { PaperModel } from "./paper.models.js";
import { UserModel } from "../auth/auth.models.js";

const now = () => new Date().toISOString();
export const FORTY_FIVE_DAYS_MS = 45 * 24 * 60 * 60 * 1000;

function ensureDatabase() {
  if (!env.MONGODB_URI || mongoose.connection.readyState === 0) {
    throw new ApiError(503, "Paper saving requires a MongoDB connection");
  }
}

/**
 * Automatically delete question papers older than 45 days
 */
export async function deleteExpiredPapers() {
  if (!env.MONGODB_URI || mongoose.connection.readyState === 0) return;
  const cutoffDate = new Date(Date.now() - FORTY_FIVE_DAYS_MS);
  const cutoffIso = cutoffDate.toISOString();
  return PaperModel.deleteMany({
    $or: [
      { createdAtDate: { $lte: cutoffDate } },
      { createdAt: { $lte: cutoffIso } }
    ]
  });
}

export async function listPapers(ownerId: string) {
  ensureDatabase();
  const cutoffIso = new Date(Date.now() - FORTY_FIVE_DAYS_MS).toISOString();
  return PaperModel.find({
    ownerId,
    status: { $ne: "archived" },
    createdAt: { $gt: cutoffIso }
  }).select("-_id").sort({ createdAt: -1 }).lean<Paper[]>();
}

export async function getPaper(id: string, ownerId: string) {
  ensureDatabase();
  const cutoffIso = new Date(Date.now() - FORTY_FIVE_DAYS_MS).toISOString();
  const paper = await PaperModel.findOne({
    id,
    ownerId,
    createdAt: { $gt: cutoffIso }
  }).select("-_id").lean<Paper>();
  if (!paper) throw new ApiError(404, "Paper not found or has expired (45-day retention limit)");
  return paper;
}

export async function countActivePapers(ownerId: string) {
  ensureDatabase();
  const cutoffIso = new Date(Date.now() - FORTY_FIVE_DAYS_MS).toISOString();
  return PaperModel.countDocuments({
    ownerId,
    status: { $ne: "archived" },
    createdAt: { $gt: cutoffIso }
  });
}

export async function countUserTotalQuestions(ownerId: string): Promise<number> {
  ensureDatabase();
  const cutoffIso = new Date(Date.now() - FORTY_FIVE_DAYS_MS).toISOString();
  const aggregation = await PaperModel.aggregate([
    { $match: { ownerId, status: { $ne: "archived" }, createdAt: { $gt: cutoffIso } } },
    { $project: { questionCount: { $size: { $ifNull: ["$questions", []] } } } },
    { $group: { _id: null, total: { $sum: "$questionCount" } } }
  ]);
  return aggregation[0]?.total || 0;
}

export async function createPaper(
  ownerId: string,
  plan: PlanCode,
  input: Omit<Paper, "id" | "ownerId" | "status" | "questions" | "createdAt" | "updatedAt">,
  req?: Request
) {
  ensureDatabase();

  // 1. Device information & fraud prevention check
  if (req) {
    const deviceCheck = await checkDeviceFreeLimit(req, plan);
    if (!deviceCheck.allowed) {
      throw new ApiError(403, deviceCheck.reason);
    }
  }

  // 2. Package limit enforcement
  const papersThisMonth = await countActivePapers(ownerId);
  const currentTotalQuestions = await countUserTotalQuestions(ownerId);
  const enforcement = assertWithinPlan(plan, {
    papersThisMonth,
    questionsInPaper: 0,
    totalQuestionsCreated: currentTotalQuestions
  });
  if (!enforcement.allowed) throw new ApiError(402, enforcement.reason);

  const timestamp = now();
  const dateObj = new Date();
  const user = await UserModel.findOne({ id: ownerId }).lean();
  const userPlan = getPlan(plan);
  const canBrand = userPlan.branding && Boolean(user?.instituteBranding);

  const paper: Paper = {
    id: `paper_${nanoid(10)}`,
    ownerId,
    status: "draft",
    questions: [],
    createdAt: timestamp,
    createdAtDate: dateObj,
    updatedAt: timestamp,
    ...input,
    institute: canBrand ? (input.institute || user?.institute) : undefined,
    instituteLogo: canBrand ? (input.instituteLogo || user?.instituteLogo) : undefined,
    instituteBranding: canBrand
  };
  await PaperModel.create(paper);

  // 3. Record device usage if on free plan
  if (req && plan === "free") {
    await recordDevicePaperCreation(req, ownerId, plan);
  }

  return paper;
}

export async function updatePaperQuestions(
  paperId: string,
  ownerId: string,
  plan: PlanCode,
  questions: Question[],
  userRole?: string
) {
  ensureDatabase();
  const existingPaper = await getPaper(paperId, ownerId);

  // If questions have already been created on this paper, regular users cannot edit them
  if (userRole !== "admin" && existingPaper.questions && existingPaper.questions.length > 0) {
    throw new ApiError(403, "Editing created questions is not permitted.");
  }

  // 1. Check max questions per paper (Free allows max 30)
  const perPaperEnforcement = assertWithinPlan(plan, {
    questionsInPaper: questions.length
  });
  if (!perPaperEnforcement.allowed) {
    throw new ApiError(402, perPaperEnforcement.reason);
  }

  // 2. Check total question quota across account (Free: 60, Pro: 7000, Ultra: 15000)
  const currentTotal = await countUserTotalQuestions(ownerId);
  const existingPaperQuestionsCount = existingPaper.questions?.length || 0;
  const projectedTotal = currentTotal - existingPaperQuestionsCount + questions.length;

  const totalQuotaEnforcement = assertWithinPlan(plan, {
    totalQuestionsCreated: projectedTotal
  });
  if (!totalQuotaEnforcement.allowed) {
    throw new ApiError(402, totalQuotaEnforcement.reason);
  }

  const paper = await PaperModel.findOneAndUpdate(
    { id: paperId, ownerId },
    { $set: { questions, updatedAt: now() } },
    { new: true, projection: { _id: 0 } }
  ).lean<Paper>();
  if (!paper) throw new ApiError(404, "Paper not found");
  return paper;
}

export async function updatePaper(
  paperId: string,
  ownerId: string,
  plan: PlanCode,
  patch: Partial<Omit<Paper, "id" | "ownerId" | "createdAt" | "updatedAt">>,
  userRole?: string
) {
  ensureDatabase();

  // If questions are included in update, validate according to package and edit permissions
  if (patch.questions && Array.isArray(patch.questions)) {
    return updatePaperQuestions(paperId, ownerId, plan, patch.questions, userRole);
  }

  const paper = await PaperModel.findOneAndUpdate(
    { id: paperId, ownerId },
    { $set: { ...patch, updatedAt: now() } },
    { new: true, projection: { _id: 0 } }
  ).lean<Paper>();
  if (!paper) throw new ApiError(404, "Paper not found");
  return paper;
}

export async function duplicatePaper(id: string, ownerId: string, plan: PlanCode, req?: Request) {
  const source = await getPaper(id, ownerId);
  return createPaper(
    ownerId,
    plan,
    {
      name: `${source.name} Copy`,
      subject: source.subject,
      className: source.className,
      examType: source.examType,
      duration: source.duration,
      totalMarks: source.totalMarks,
      instructions: source.instructions,
      questionNumberStyle: source.questionNumberStyle,
      optionLabelStyle: source.optionLabelStyle,
      questionsPerPage: source.questionsPerPage,
      layout: source.layout,
      mcqSectionTitle: source.mcqSectionTitle,
      cqSectionTitle: source.cqSectionTitle
    },
    req
  );
}

export async function setStatus(id: string, ownerId: string, status: Paper["status"]) {
  ensureDatabase();
  const paper = await PaperModel.findOneAndUpdate(
    { id, ownerId },
    { $set: { status, updatedAt: now() } },
    { new: true, projection: { _id: 0 } }
  ).lean<Paper>();
  if (!paper) throw new ApiError(404, "Paper not found");
  return paper;
}

export async function deletePaper(id: string, ownerId: string) {
  ensureDatabase();
  const paper = await PaperModel.findOneAndDelete({ id, ownerId }, { projection: { _id: 0 } }).lean<Paper>();
  if (!paper) throw new ApiError(404, "Paper not found");
  return paper;
}
