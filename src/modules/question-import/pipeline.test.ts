import assert from "node:assert/strict";
import test from "node:test";
import { documentProcessingPipeline } from "./pipeline/documentPipeline.js";
import { equationRecognizer } from "./pipeline/equationRecognizer.js";
import { layoutDetector } from "./pipeline/layoutDetector.js";
import { questionAssembler } from "./pipeline/questionAssembler.js";
import { structureClassifier } from "./pipeline/structureClassifier.js";
import { tempAssetStore } from "./pipeline/tempAssetStore.js";
import type { RecognizedBlock } from "./pipeline/types.js";
import { questionValidator } from "./pipeline/validator.js";

test("StructureClassifier identifies QUESTION_START, MCQ_OPTION, SUBQUESTION, and SECTION_HEADER", () => {
  const qStartBlock: RecognizedBlock = {
    id: "b1",
    pageNumber: 1,
    text: "১. বলের এসআই (SI) একক কোনটি?",
    confidence: 0.95,
    bbox: { x: 0.1, y: 0.1, width: 0.8, height: 0.05 },
    role: "UNKNOWN",
    readingOrderIndex: 0
  };
  const classifiedQ = structureClassifier.classifyBlock(qStartBlock);
  assert.equal(classifiedQ.role, "QUESTION_START");
  assert.equal(classifiedQ.label, "১");

  const optBlock: RecognizedBlock = {
    id: "b2",
    pageNumber: 1,
    text: "ক) নিউটন",
    confidence: 0.95,
    bbox: { x: 0.1, y: 0.15, width: 0.4, height: 0.04 },
    role: "UNKNOWN",
    readingOrderIndex: 1
  };
  const classifiedOpt = structureClassifier.classifyBlock(optBlock);
  assert.equal(classifiedOpt.role, "MCQ_OPTION");

  const subQBlock: RecognizedBlock = {
    id: "b3",
    pageNumber: 1,
    text: "ক. ত্বরণ কাকে বলে? [১]",
    confidence: 0.95,
    bbox: { x: 0.1, y: 0.2, width: 0.8, height: 0.04 },
    role: "UNKNOWN",
    readingOrderIndex: 2
  };
  const classifiedSubQ = structureClassifier.classifyBlock(subQBlock);
  assert.equal(classifiedSubQ.role, "SUBQUESTION");
  assert.equal(classifiedSubQ.label, "ক");
  assert.equal(classifiedSubQ.marks, 1);

  const sectionBlock: RecognizedBlock = {
    id: "b4",
    pageNumber: 1,
    text: "ক-বিভাগ : বহুনির্বাচনি প্রশ্ন",
    confidence: 0.98,
    bbox: { x: 0.1, y: 0.02, width: 0.8, height: 0.04 },
    role: "UNKNOWN",
    readingOrderIndex: 3
  };
  const classifiedSection = structureClassifier.classifyBlock(sectionBlock);
  assert.equal(classifiedSection.role, "SECTION_HEADER");
});

test("EquationRecognizer cleans and wraps standard math formulas into LaTeX", () => {
  const result = equationRecognizer.recognizeExpression("Solve x² + 1/2x = 0 where √16 = 4");
  assert.equal(result.type, "equation");
  assert.match(result.latex, /x\^2/);
  assert.match(result.latex, /\\frac\{1\}\{2\}/);
  assert.match(result.latex, /\\sqrt\{16\}/);
  assert.equal(result.needsReview, false);
});

test("QuestionAssembler builds MCQ question with Bengali options and answer", () => {
  const blocks: RecognizedBlock[] = [
    {
      id: "b1",
      pageNumber: 1,
      text: "১. পানির রাসায়নিক সংকেত কোনটি?",
      confidence: 0.98,
      bbox: { x: 0.1, y: 0.1, width: 0.8, height: 0.04 },
      role: "QUESTION_START",
      readingOrderIndex: 0
    },
    {
      id: "b2",
      pageNumber: 1,
      text: "(ক) CO2   (খ) H2O   (গ) NaCl   (ঘ) HCl",
      confidence: 0.95,
      bbox: { x: 0.1, y: 0.15, width: 0.8, height: 0.04 },
      role: "MCQ_OPTION",
      readingOrderIndex: 1
    },
    {
      id: "b3",
      pageNumber: 1,
      text: "উত্তর: খ",
      confidence: 0.99,
      bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.03 },
      role: "QUESTION_TEXT",
      readingOrderIndex: 2
    }
  ];

  const questions = questionAssembler.assemble(blocks, []);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].number, "১");
  assert.equal(questions[0].type, "mcq");
  assert.equal(questions[0].correct, 1);
  assert.deepEqual(questions[0].options, ["CO2", "H2O", "NaCl", "HCl"]);
});

test("QuestionAssembler builds Creative Question (CQ) with stem and subquestions", () => {
  const blocks: RecognizedBlock[] = [
    {
      id: "b1",
      pageNumber: 1,
      text: "২. নিচের উদ্দীপকটি পড়ে প্রশ্নগুলোর উত্তর দাও:\nএকটি গাড়ি স্থির অবস্থান থেকে 2 m/s^2 সুষম ত্বরণে চলতে শুরু করল।",
      confidence: 0.98,
      bbox: { x: 0.1, y: 0.1, width: 0.8, height: 0.08 },
      role: "QUESTION_START",
      readingOrderIndex: 0
    },
    {
      id: "b2",
      pageNumber: 1,
      text: "ক. ত্বরণ কাকে বলে? [১]",
      confidence: 0.95,
      bbox: { x: 0.1, y: 0.2, width: 0.8, height: 0.04 },
      role: "SUBQUESTION",
      readingOrderIndex: 1
    },
    {
      id: "b3",
      pageNumber: 1,
      text: "খ. সুষম বেগ ব্যাখ্যা কর। [২]",
      confidence: 0.95,
      bbox: { x: 0.1, y: 0.25, width: 0.8, height: 0.04 },
      role: "SUBQUESTION",
      readingOrderIndex: 2
    },
    {
      id: "b4",
      pageNumber: 1,
      text: "গ. ৫ সেকেন্ড পর গাড়িটির বেগ নির্ণয় কর। [৩]",
      confidence: 0.95,
      bbox: { x: 0.1, y: 0.3, width: 0.8, height: 0.04 },
      role: "SUBQUESTION",
      readingOrderIndex: 3
    },
    {
      id: "b5",
      pageNumber: 1,
      text: "ঘ. উদ্দীপকের তথ্যের আলোকে ১০ সেকেন্ডে অতিক্রান্ত দূরত্ব গাণিতিকভাবে বিশ্লেষণ কর। [৪]",
      confidence: 0.95,
      bbox: { x: 0.1, y: 0.35, width: 0.8, height: 0.04 },
      role: "SUBQUESTION",
      readingOrderIndex: 4
    }
  ];

  const questions = questionAssembler.assemble(blocks, []);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].number, "২");
  assert.equal(questions[0].type, "cq");
  assert.equal(questions[0].marks, 10);
  assert.ok(questions[0].subQuestions && questions[0].subQuestions.length === 4);
  assert.equal(questions[0].subQuestions[0].label, "ক");
  assert.equal(questions[0].subQuestions[0].marks, 1);
  assert.equal(questions[0].subQuestions[3].label, "ঘ");
  assert.equal(questions[0].subQuestions[3].marks, 4);
});

test("Strict Cloudinary Requirement: Diagram crops stored in tempAssetStore during preview, not uploaded to Cloudinary", async () => {
  const dummyBuffer = Buffer.from("fake-diagram-png-content-stream-bytes-12345");
  const jobId = "job_test_crop_100";
  const userId = "usr_teacher_1";

  // Create temporary asset in temp store
  const assetId = "crop_diagram_001";
  tempAssetStore.createJob(jobId, userId, "image");
  tempAssetStore.storeAsset({
    id: assetId,
    jobId,
    pageNumber: 1,
    mimeType: "image/png",
    buffer: dummyBuffer,
    bbox: { x: 0.1, y: 0.2, width: 0.6, height: 0.4 },
    filename: "circuit_diagram.png",
    regionClass: "diagram",
    createdAt: Date.now()
  });

  // 1. Verify preview retrieval returns local buffer without any Cloudinary call
  const retrievedAsset = tempAssetStore.getAsset(jobId, assetId, userId);
  assert.ok(retrievedAsset);
  assert.equal(retrievedAsset.buffer.toString(), dummyBuffer.toString());

  // 2. Verify unauthorized user cannot access this job's temporary assets
  const unauthorizedAsset = tempAssetStore.getAsset(jobId, assetId, "usr_hacker_2");
  assert.equal(unauthorizedAsset, null);

  // 3. Verify resolveTemporaryUrlOnSave only converts to permanent URL when saving
  const tempPreviewUrl = `/api/question-import/jobs/${jobId}/assets/${assetId}`;
  const permanentUrl = await tempAssetStore.resolveTemporaryUrlOnSave(tempPreviewUrl, userId);
  assert.ok(permanentUrl);
  // Falls back to data URL if Cloudinary is unconfigured or uploads to Cloudinary if configured
  assert.ok(permanentUrl.startsWith("http") || permanentUrl.startsWith("data:image/"));
});

test("ValidationReport accurately identifies missing options and low confidence", () => {
  const validReport = questionValidator.validate([
    {
      id: "q1",
      number: "1",
      title: "What is power?",
      marks: 1,
      type: "mcq",
      options: ["Rate of doing work", "Energy", "Force", "Velocity"],
      correct: 0,
      warnings: [],
      confidence: { ocr: 0.95, layout: 0.9, structure: 0.95, overall: 0.95 },
      reviewRequired: false
    }
  ]);
  assert.equal(validReport.status, "ready_for_preview");
  assert.equal(validReport.reviewRequiredCount, 0);

  const invalidReport = questionValidator.validate([
    {
      id: "q2",
      number: "2",
      title: "Incomplete question",
      marks: 1,
      type: "mcq",
      options: ["Only one option"], // Invalid MCQ with < 2 options
      correct: null,
      warnings: [],
      confidence: { ocr: 0.6, layout: 0.5, structure: 0.5, overall: 0.5 },
      reviewRequired: true
    }
  ]);
  assert.equal(invalidReport.status, "review_required");
  assert.ok(invalidReport.reviewRequiredCount > 0);
  assert.ok(invalidReport.warnings.some((w) => w.includes("fewer than two valid options")));
});

test("DocumentProcessingPipeline runs end-to-end on sample PDF document", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const pdfPath = path.resolve(process.cwd(), "sample_out.pdf");
  const pdfBuffer = fs.readFileSync(pdfPath);
  const dataUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

  const result = await documentProcessingPipeline.processDocument("pdf", [
    { name: "sample_out.pdf", mimeType: "application/pdf", dataUrl }
  ], { userId: "usr_test_pipeline" });

  assert.ok(result.jobId);
  assert.ok(result.metrics.totalPages >= 1);
  assert.ok(result.metrics.totalPipelineTimeMs > 0);
  assert.ok(result.validation);
});
