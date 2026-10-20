import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { ok, validate } from "../../utils/http.js";
import { updatePaperQuestions } from "../papers/paper.service.js";
import { saveQuestionsSchema } from "./question.schemas.js";
import { asyncHandler } from "../../utils/http.js";

export const questionRouter = Router({ mergeParams: true });

questionRouter.use(requireAuth);

questionRouter.put("/:paperId/questions", validate(saveQuestionsSchema), asyncHandler(async (req, res) => {
  const paper = await updatePaperQuestions(String(req.params.paperId), req.user!.id, req.user!.plan, req.body.questions, req.user!.role);
  return ok(res, paper, "Questions saved");
}));
