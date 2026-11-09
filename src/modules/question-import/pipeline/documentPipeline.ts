import { nanoid } from "nanoid";
import { equationRecognizer } from "./equationRecognizer.js";
import { layoutDetector } from "./layoutDetector.js";
import { ocrEngine } from "./ocrEngine.js";
import { pageRenderer, type RawUploadFile } from "./pageRenderer.js";
import { questionAssembler } from "./questionAssembler.js";
import { tempAssetStore } from "./tempAssetStore.js";
import type { ExtractionJob, ImportType, QuestionAssemblyResult, RecognizedBlock } from "./types.js";
import { questionValidator } from "./validator.js";

export type PipelineOptions = {
  jobId?: string;
  userId?: string;
};

export type PipelineExecutionResult = {
  jobId: string;
  importType: ImportType;
  questions: QuestionAssemblyResult[];
  warnings: string[];
  metrics: {
    totalPages: number;
    detectedRegionsCount: number;
    ocrExecutionTimeMs: number;
    totalPipelineTimeMs: number;
  };
  validation: ReturnType<typeof questionValidator.validate>;
};

export class DocumentProcessingPipeline {
  /**
   * Main modular document processing entry point.
   * Completely replaces generative LLM dependency with an ML & deterministic pipeline.
   */
  async processDocument(
    importType: ImportType,
    files: RawUploadFile[],
    options: PipelineOptions = {}
  ): Promise<PipelineExecutionResult> {
    const started = Date.now();
    const jobId = options.jobId || `job_${nanoid(12)}`;
    const userId = options.userId || "usr_anonymous";

    // 1. Initialize extraction job in temp store
    const job = tempAssetStore.createJob(jobId, userId, importType);
    job.status = "processing";

    const allWarnings: string[] = [];

    try {
      // 2. Page Rendering & Native Extraction (Searchable PDF / Scanned PDF / Image / DOCX)
      const renderRes = await pageRenderer.processFiles(importType, files);
      job.pages = renderRes.pages;
      allWarnings.push(...renderRes.warnings);

      // 3. Document Layout & Visual Region Detection (Model B) + Temporary Diagram Cropping
      const layoutRes = await layoutDetector.detectRegions(jobId, job.pages);
      job.regions = layoutRes.regions;
      allWarnings.push(...layoutRes.warnings);

      // 4. Bilingual OCR & Text Recognition (Model A)
      const ocrStart = Date.now();
      const allBlocks: RecognizedBlock[] = [];

      for (const page of job.pages) {
        const ocrRes = await ocrEngine.processPage(page);
        allBlocks.push(...ocrRes.blocks);
        allWarnings.push(...ocrRes.warnings);
      }
      const ocrTimeMs = Date.now() - ocrStart;

      // 5. Mathematical Equation Normalization (Model C)
      for (const block of allBlocks) {
        block.text = equationRecognizer.processTextEquations(block.text);
      }

      // 6. Deterministic Question Assembly (Phase Six)
      const assembledQuestions = questionAssembler.assemble(allBlocks, job.regions);

      // Link temporary image preview URLs to current jobId
      for (const q of assembledQuestions) {
        if (q.temporaryAssetId) {
          q.imageUrl = `/api/question-import/jobs/${jobId}/assets/${q.temporaryAssetId}`;
        }
      }

      // 7. Quality Validation & Quality Classification (Phase Nine)
      const validationReport = questionValidator.validate(assembledQuestions);
      allWarnings.push(...validationReport.warnings);

      const totalTimeMs = Date.now() - started;

      job.questions = assembledQuestions;
      job.warnings = Array.from(new Set(allWarnings));
      job.status = "completed";
      job.metrics = {
        totalPages: job.pages.length,
        detectedRegionsCount: job.regions.length,
        ocrExecutionTimeMs: ocrTimeMs,
        totalPipelineTimeMs: totalTimeMs
      };

      tempAssetStore.updateJob(jobId, job);

      return {
        jobId,
        importType,
        questions: assembledQuestions,
        warnings: job.warnings,
        metrics: job.metrics,
        validation: validationReport
      };
    } catch (pipelineErr) {
      job.status = "failed";
      const errMsg = pipelineErr instanceof Error ? pipelineErr.message : String(pipelineErr);
      job.warnings.push(`Document processing failed: ${errMsg}`);
      tempAssetStore.updateJob(jobId, job);

      return {
        jobId,
        importType,
        questions: [],
        warnings: job.warnings,
        metrics: {
          totalPages: job.pages.length,
          detectedRegionsCount: 0,
          ocrExecutionTimeMs: 0,
          totalPipelineTimeMs: Date.now() - started
        },
        validation: {
          status: "processing_failed",
          totalQuestions: 0,
          readyQuestionsCount: 0,
          reviewRequiredCount: 0,
          warnings: job.warnings
        }
      };
    }
  }
}

export const documentProcessingPipeline = new DocumentProcessingPipeline();
