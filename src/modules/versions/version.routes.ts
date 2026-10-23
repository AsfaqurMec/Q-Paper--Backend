import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { ApiError, asyncHandler, ok } from "../../utils/http.js";
import { getPaper } from "../papers/paper.service.js";
import { getPlan } from "../plans/plan.service.js";

export const versionRouter = Router();

versionRouter.use(requireAuth);

versionRouter.post("/:paperId/versions", asyncHandler(async (req, res, next) => {
  const plan = getPlan(req.user!.plan);
  if (!plan.multipleVersions && req.user!.role !== "admin") {
    return next(new ApiError(403, "Multiple paper versions are only available in packages with Multiple Versions enabled (Small, Pro, Ultra, Diamond). Please upgrade your package."));
  }
  const paper = await getPaper(String(req.params.paperId), req.user!.id);
  const versions = ["A", "B", "C"].map((version, index) => ({
    version,
    paperId: paper.id,
    questionOrder: paper.questions.map((question) => question.id).sort(() => (index === 0 ? 0 : Math.random() - 0.5)),
    answerSheetUpdated: true
  }));
  return ok(res, versions, "Paper versions generated");
}));
