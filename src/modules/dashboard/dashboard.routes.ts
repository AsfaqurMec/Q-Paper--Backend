import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { asyncHandler, ok } from "../../utils/http.js";
import { getPlan } from "../plans/plan.service.js";
import { listPapers } from "../papers/paper.service.js";

import { QuestionBankItemModel } from "../question-bank/questionBank.models.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/", asyncHandler(async (req, res) => {
  const plan = getPlan(req.user!.plan);
  const papers = await listPapers(req.user!.id);
  const totalBankCount = await QuestionBankItemModel.countDocuments().catch(() => 0);
  const totalQuestionsUsed = papers.reduce((sum, p) => sum + (p.questions?.length || 0), 0);

  // Dynamic past 6 months calculation
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const past6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      month: monthNames[d.getMonth()],
      year: d.getFullYear(),
      monthNum: d.getMonth()
    };
  });

  const papersCreatedChart = past6Months.map(({ month, year, monthNum }) => {
    const value = papers.filter((p) => {
      const pDate = p.createdAt ? new Date(p.createdAt) : null;
      return pDate && pDate.getFullYear() === year && pDate.getMonth() === monthNum;
    }).length;
    return { month, value };
  });

  const downloadsChart = past6Months.map(({ month, year, monthNum }) => {
    const value = papers.filter((p) => {
      const pDate = p.createdAt ? new Date(p.createdAt) : null;
      return pDate && pDate.getFullYear() === year && pDate.getMonth() === monthNum;
    }).length;
    return { month, value: Math.max(value, 0) };
  });

  const recentActivity = papers.length > 0
    ? papers.slice(0, 5).map((p) => `প্রশ্নপত্র তৈরি: ${p.name} (${p.subject} • ${p.questions?.length || 0}টি প্রশ্ন)`)
    : [
        "প্রশ্নপত্র কমান্ড সেন্টার প্রস্তুত",
        "৩,৫০০+ প্রশ্নব্যাংক থেকে দ্রুত প্রশ্ন নির্বাচন করুন",
        "৪-সেট শাফলিং ও কাটেক্স সমীকরণ সম্বলিত প্রশ্ন তৈরি করুন"
      ];

  return ok(res, {
    stats: {
      totalPapers: papers.length,
      papersRemaining: plan.code === "diamond" ? 999999 : Math.max(plan.paperLimit - papers.length, 0),
      currentPlan: plan.name,
      planCode: plan.code,
      totalQuestions: totalQuestionsUsed,
      totalQuestionsLimit: plan.totalQuestionsLimit,
      subscriptionExpiry: req.user!.plan === "free" ? "Lifetime free tier" : "Monthly Auto-renew",
      totalDownloads: papers.length,
      questionBankCount: totalBankCount
    },
    charts: {
      papersCreated: papersCreatedChart,
      downloads: downloadsChart
    },
    recentActivity
  });
}));
