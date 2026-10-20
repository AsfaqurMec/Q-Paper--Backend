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
  const userBankCount = await QuestionBankItemModel.countDocuments({ ownerId: req.user!.id }).catch(() => 0);
  const totalBankCount = userBankCount > 0 ? userBankCount : await QuestionBankItemModel.countDocuments().catch(() => 0);

  const totalQuestionsUsed = papers.reduce((sum, p) => sum + (p.questions?.length || 0), 0);

  return ok(res, {
    stats: {
      totalPapers: papers.length,
      papersRemaining: plan.code === "diamond" ? 999999 : Math.max(plan.paperLimit - papers.length, 0),
      currentPlan: plan.name,
      planCode: plan.code,
      totalQuestions: totalQuestionsUsed,
      totalQuestionsLimit: plan.totalQuestionsLimit,
      subscriptionExpiry: req.user!.plan === "free" ? "Lifetime free tier" : "Monthly Auto-renew",
      totalDownloads: 126,
      questionBankCount: totalBankCount
    },
    charts: {
      papersCreated: [
        { month: "Jan", value: 4 },
        { month: "Feb", value: 7 },
        { month: "Mar", value: 9 },
        { month: "Apr", value: 12 },
        { month: "May", value: 16 },
        { month: "Jun", value: 11 }
      ],
      downloads: [
        { month: "Jan", value: 12 },
        { month: "Feb", value: 19 },
        { month: "Mar", value: 25 },
        { month: "Apr", value: 34 },
        { month: "May", value: 41 },
        { month: "Jun", value: 32 }
      ]
    },
    recentActivity: [
      "Generated answer sheet for SSC Physics Model Test",
      "Updated organization branding",
      "Autosaved 18 questions in Chemistry Chapter Test"
    ]
  });
}));
