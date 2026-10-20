import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { ApiError, asyncHandler, ok } from "../../utils/http.js";
import { getPaper } from "../papers/paper.service.js";

export const versionRouter = Router();

versionRouter.use(requireAuth);

versionRouter.post("/:paperId/versions", asyncHandler(async (req, res, next) => {
  if (req.user!.plan !== "pro") return next(new ApiError(402, "Multiple paper versions require Pro plan"));
  const paper = await getPaper(String(req.params.paperId), req.user!.id);
  const versions = ["A", "B", "C"].map((version, index) => ({
    version,
    paperId: paper.id,
    questionOrder: paper.questions.map((question) => question.id).sort(() => (index === 0 ? 0 : Math.random() - 0.5)),
    answerSheetUpdated: true
  }));
  return ok(res, versions, "Paper versions generated");
}));
