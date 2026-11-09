import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { ApiError, asyncHandler, ok, validate } from "../../utils/http.js";
import { getPlan } from "../plans/plan.service.js";
import { documentProcessingPipeline } from "./pipeline/documentPipeline.js";
import { tempAssetStore } from "./pipeline/tempAssetStore.js";
import type { QuestionAssemblyResult, ReviewedCorrection } from "./pipeline/types.js";

const parseSchema = z.object({
  importType: z.enum(["image", "pdf", "docx"]),
  files: z
    .array(
      z.object({
        name: z.string().min(1),
        mimeType: z.string().optional(),
        dataUrl: z.string().startsWith("data:")
      })
    )
    .min(1)
    .max(10)
});

const feedbackSchema = z.object({
  jobId: z.string().min(1),
  questionId: z.string().min(1),
  originalText: z.string(),
  correctedText: z.string(),
  originalType: z.string(),
  correctedType: z.string(),
  originalOptions: z.array(z.string()).optional(),
  correctedOptions: z.array(z.string()).optional(),
  cropAssetId: z.string().optional(),
  modelVersion: z.string().default("q-paper-ml-v1.0")
});

export const questionImportRouter = Router();

questionImportRouter.use(requireAuth);

/**
 * Main ML document parsing endpoint.
 * Zero Generative AI / LLM API dependency.
 * Outputs questions with protected temporary diagram crop references.
 */
questionImportRouter.post(
  "/parse",
  validate(parseSchema),
  asyncHandler(async (req, res) => {
    const plan = getPlan(req.user?.plan || "free");
    if (!plan.importQuestion && req.user?.role !== "admin") {
      throw new ApiError(
        403,
        "The Question Import feature is only available in the Ultra and Diamond packages. Please upgrade your plan."
      );
    }

    const input = req.body as z.infer<typeof parseSchema>;

    const pipelineResult = await documentProcessingPipeline.processDocument(
      input.importType,
      input.files,
      { userId: req.user!.id }
    );

    return ok(
      res,
      {
        jobId: pipelineResult.jobId,
        importType: input.importType,
        extractedText: pipelineResult.questions.map((q) => q.title).join("\n\n").trim(),
        warnings: pipelineResult.warnings,
        metrics: pipelineResult.metrics,
        validation: pipelineResult.validation,
        questions: pipelineResult.questions.map((q, idx) =>
          toClientQuestion(q, idx, pipelineResult.jobId)
        )
      },
      "Questions parsed using ML Document Pipeline"
    );
  })
);

/**
 * Protected job-scoped asset endpoint.
 * Serves temporary diagram crops without any Cloudinary upload during preview.
 */
questionImportRouter.get(
  "/jobs/:jobId/assets/:assetId",
  asyncHandler(async (req, res) => {
    const jobId = String(req.params.jobId);
    const assetId = String(req.params.assetId);
    const asset = tempAssetStore.getAsset(jobId, assetId, req.user?.id);

    if (!asset) {
      throw new ApiError(404, "Temporary visual asset not found or expired.");
    }

    res.setHeader("Content-Type", asset.mimeType || "image/png");
    res.setHeader("Cache-Control", "private, max-age=3600");
    return res.status(200).send(asset.buffer);
  })
);

/**
 * Phase Eleven: Reviewed Corrections Feedback API
 * Captures verified human corrections to train and fine-tune subsequent model iterations.
 */
const reviewedCorrectionsStore: ReviewedCorrection[] = [];

questionImportRouter.post(
  "/feedback",
  validate(feedbackSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof feedbackSchema>;
    const correction: ReviewedCorrection = {
      id: `cor_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      userId: req.user!.id,
      jobId: input.jobId,
      questionId: input.questionId,
      originalText: input.originalText,
      correctedText: input.correctedText,
      originalType: input.originalType,
      correctedType: input.correctedType,
      originalOptions: input.originalOptions,
      correctedOptions: input.correctedOptions,
      cropAssetId: input.cropAssetId,
      modelVersion: input.modelVersion,
      timestamp: new Date().toISOString()
    };

    reviewedCorrectionsStore.push(correction);

    return ok(
      res,
      {
        feedbackId: correction.id,
        status: "recorded",
        totalCorrectionsCollected: reviewedCorrectionsStore.length
      },
      "Reviewed correction recorded for model retraining"
    );
  })
);

function toClientQuestion(question: QuestionAssemblyResult, index: number, jobId: string) {
  const options = question.options.map((option) => String(option).trim()).filter(Boolean);
  const warnings = [...question.warnings];
  const isCq = question.type === "cq" || (question.subQuestions && question.subQuestions.length > 0);
  const isWritten = !isCq && (question.type === "written" || options.length === 0);
  if (!isCq && !isWritten && options.length < 2) warnings.push("MCQ has fewer than two options");
  if (!question.number) warnings.push("Question numbering is unclear");

  const subQuestions = question.subQuestions?.map((sq, sqIdx) => ({
    id: sq.id || `sq_${index}_${sqIdx + 1}`,
    label: sq.label || (sqIdx === 0 ? "ক" : sqIdx === 1 ? "খ" : sqIdx === 2 ? "গ" : "ঘ"),
    text: sq.text,
    marks: Number(sq.marks || (sqIdx === 0 ? 1 : sqIdx === 1 ? 2 : sqIdx === 2 ? 3 : 4)),
    answer: sq.answer || "",
    explanation: sq.explanation || ""
  }));

  const totalMarks = isCq && subQuestions?.length
    ? subQuestions.reduce((sum, sq) => sum + (sq.marks || 0), 0)
    : Number(question.marks ?? (isCq ? 10 : isWritten ? 5 : 1));

  // If question has a temporary asset, make sure imageUrl points to protected endpoint
  const imageUrl = question.temporaryAssetId
    ? `/api/question-import/jobs/${jobId}/assets/${question.temporaryAssetId}`
    : (question.imageUrl || "");

  return {
    id: `import_${Date.now()}_${index}_${Math.random().toString(16).slice(2)}`,
    title: question.title,
    subtitle: question.subtitle ?? "",
    imageUrl,
    marks: totalMarks,
    options,
    correct: question.correct,
    explanation: question.explanation ?? "",
    warnings: Array.from(new Set(warnings)),
    type: isCq ? "cq" : isWritten ? "written" : "mcq",
    number: question.number,
    images: imageUrl ? [imageUrl] : [],
    tables: [],
    subQuestions,
    confidence: question.confidence,
    reviewRequired: question.reviewRequired
  };
}
