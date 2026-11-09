import type { QuestionAssemblyResult } from "./types.js";

export type ValidationStatus =
  | "ready_for_preview"
  | "review_required"
  | "incomplete_extraction"
  | "processing_failed";

export type ValidationReport = {
  status: ValidationStatus;
  totalQuestions: number;
  readyQuestionsCount: number;
  reviewRequiredCount: number;
  warnings: string[];
};

export class QuestionValidator {
  /**
   * Validate assembled questions against quality indicators and Q-Paper schema rules.
   */
  validate(questions: QuestionAssemblyResult[]): ValidationReport {
    const warnings: string[] = [];

    if (questions.length === 0) {
      return {
        status: "incomplete_extraction",
        totalQuestions: 0,
        readyQuestionsCount: 0,
        reviewRequiredCount: 0,
        warnings: ["No questions could be extracted from the document."]
      };
    }

    let reviewCount = 0;
    const seenNumbers = new Set<string>();

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      let needsReview = q.reviewRequired || false;

      // 1. Missing Question Text Check
      if (!q.title || q.title.trim().length < 3) {
        q.warnings.push(`Question #${i + 1} has missing or incomplete question text.`);
        needsReview = true;
      }

      // 2. MCQ Option Validation
      if (q.type === "mcq") {
        if (q.options.length < 2) {
          q.warnings.push(`MCQ #${q.number || i + 1} has fewer than two valid options.`);
          needsReview = true;
        }
        if (q.options.some((opt) => !opt.trim())) {
          q.warnings.push(`MCQ #${q.number || i + 1} contains empty options.`);
          needsReview = true;
        }
      }

      // 3. Creative Question (CQ) Subquestion Validation
      if (q.type === "cq") {
        if (!q.subQuestions || q.subQuestions.length === 0) {
          q.warnings.push(`Creative Question #${q.number || i + 1} has no detected subquestions (ক, খ, গ, ঘ).`);
          needsReview = true;
        } else {
          for (const sq of q.subQuestions) {
            if (!sq.text || sq.text.trim().length === 0) {
              q.warnings.push(`Subquestion ${sq.label || ""} in #${q.number || i + 1} has empty text.`);
              needsReview = true;
            }
          }
        }
      }

      // 4. Duplicate Question Numbering Check
      if (q.number) {
        if (seenNumbers.has(q.number)) {
          q.warnings.push(`Repeated question number "${q.number}" detected.`);
          needsReview = true;
        } else {
          seenNumbers.add(q.number);
        }
      }

      // 5. OCR Confidence Threshold Check
      if (q.confidence.ocr < 0.7) {
        q.warnings.push(`Question #${q.number || i + 1} recognized with low OCR confidence (${Math.round(q.confidence.ocr * 100)}%).`);
        needsReview = true;
      }

      q.reviewRequired = needsReview;
      if (needsReview) reviewCount++;
      warnings.push(...q.warnings);
    }

    const uniqueWarnings = Array.from(new Set(warnings));

    const status: ValidationStatus =
      reviewCount > questions.length * 0.5
        ? "review_required"
        : reviewCount > 0
          ? "review_required"
          : "ready_for_preview";

    return {
      status,
      totalQuestions: questions.length,
      readyQuestionsCount: questions.length - reviewCount,
      reviewRequiredCount: reviewCount,
      warnings: uniqueWarnings
    };
  }
}

export const questionValidator = new QuestionValidator();
