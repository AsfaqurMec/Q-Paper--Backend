import { nanoid } from "nanoid";
import {
  extractCqSubQuestion,
  extractMarks,
  extractOptionsFromLine,
  formatStemFormulas,
  repairLatexEscapes
} from "../questionImport.parser.js";
import { structureClassifier } from "./structureClassifier.js";
import type {
  DetectedRegion,
  QuestionAssemblyResult,
  RecognizedBlock
} from "./types.js";

export class QuestionAssembler {
  /**
   * Deterministically assemble recognized blocks and detected visual regions
   * into structured Q-Paper questions.
   */
  assemble(
    blocks: RecognizedBlock[],
    detectedRegions: DetectedRegion[]
  ): QuestionAssemblyResult[] {
    const classifiedBlocks = blocks.map((b) => structureClassifier.classifyBlock(b));
    const questions: QuestionAssemblyResult[] = [];

    let current: QuestionAssemblyResult | null = null;
    let pendingOptions: string[] = [];
    let pendingSubQuestions: NonNullable<QuestionAssemblyResult["subQuestions"]> = [];
    let currentRegionIds: string[] = [];

    const finalizeCurrent = () => {
      if (!current) return;

      current.options = [...pendingOptions];
      if (pendingSubQuestions.length > 0) {
        current.subQuestions = [...pendingSubQuestions];
      }

      // Determine final question type
      const isCq = (current.subQuestions && current.subQuestions.length > 0) ||
                   /(?:উদ্দীপক|দৃশ্যকল্প|চিত্রটি|passage|scenario)/iu.test(current.title);

      if (isCq) {
        current.type = "cq";
        current.marks = current.subQuestions?.reduce((sum, sq) => sum + sq.marks, 0) || current.marks || 10;
      } else if (current.options.length >= 2) {
        current.type = "mcq";
        current.marks = current.marks || 1;
      } else {
        current.type = "written";
        current.marks = current.marks || 5;
      }

      current.associatedRegionIds = [...currentRegionIds];
      questions.push(current);

      current = null;
      pendingOptions = [];
      pendingSubQuestions = [];
      currentRegionIds = [];
    };

    for (let i = 0; i < classifiedBlocks.length; i++) {
      const block = classifiedBlocks[i];
      const trimmed = block.text.trim();
      if (!trimmed) continue;

      // 1. Answer indicator
      const optRes = extractOptionsFromLine(trimmed);
      if (optRes.answerIndex !== null && current) {
        current.correct = optRes.answerIndex;
        continue;
      }

      // 2. Question Header or boundary
      if (block.role === "QUESTION_START") {
        finalizeCurrent();

        const { marks, cleanedText } = extractMarks(trimmed);
        current = {
          id: `q_${nanoid(10)}`,
          number: block.label || null,
          title: formatStemFormulas(repairLatexEscapes(cleanedText)),
          subtitle: null,
          marks: marks || block.marks || 1,
          type: "mcq",
          options: [],
          correct: null,
          warnings: [],
          confidence: {
            ocr: block.confidence,
            layout: 0.9,
            structure: 0.95,
            overall: block.confidence
          },
          reviewRequired: block.needsReview || false,
          sourcePage: block.pageNumber,
          associatedRegionIds: []
        };
        continue;
      }

      // 3. Section Header or Instruction
      if (block.role === "SECTION_HEADER" || block.role === "INSTRUCTION" || block.role === "HEADER" || block.role === "FOOTER") {
        continue;
      }

      // If no active question, initiate one
      if (!current) {
        if (optRes.isOption) continue;
        const { marks, cleanedText } = extractMarks(trimmed);
        current = {
          id: `q_${nanoid(10)}`,
          number: null,
          title: formatStemFormulas(repairLatexEscapes(cleanedText)),
          subtitle: null,
          marks: marks || 1,
          type: "written",
          options: [],
          correct: null,
          warnings: [],
          confidence: {
            ocr: block.confidence,
            layout: 0.8,
            structure: 0.8,
            overall: block.confidence
          },
          reviewRequired: true,
          sourcePage: block.pageNumber,
          associatedRegionIds: []
        };
        continue;
      }

      // 4. CQ Subquestion
      if (block.role === "SUBQUESTION") {
        const cqSub = extractCqSubQuestion(trimmed);
        if (cqSub) {
          pendingSubQuestions.push({
            id: `sq_${pendingSubQuestions.length + 1}`,
            label: cqSub.label,
            text: formatStemFormulas(repairLatexEscapes(cqSub.text)),
            marks: cqSub.marks
          });
          continue;
        }
      }

      // 5. MCQ Option
      if (block.role === "MCQ_OPTION" || optRes.isOption) {
        if (optRes.options.length > 0) {
          pendingOptions.push(...optRes.options.map((o) => formatStemFormulas(repairLatexEscapes(o))));
          continue;
        }
      }

      // 6. Figure reference: link candidate diagram to active question
      if (block.role === "FIGURE_REFERENCE" || /(?:চিত্র|diagram|figure)/i.test(trimmed)) {
        current.title = `${current.title}\n${formatStemFormulas(trimmed)}`.trim();
        continue;
      }

      // 7. Continuation text
      if (pendingSubQuestions.length > 0) {
        const lastSq = pendingSubQuestions[pendingSubQuestions.length - 1];
        lastSq.text = `${lastSq.text} ${formatStemFormulas(repairLatexEscapes(trimmed))}`.trim();
      } else if (pendingOptions.length === 0) {
        current.title = `${current.title}\n${formatStemFormulas(repairLatexEscapes(trimmed))}`.trim();
      } else {
        const lastIdx = pendingOptions.length - 1;
        pendingOptions[lastIdx] = `${pendingOptions[lastIdx]} ${formatStemFormulas(repairLatexEscapes(trimmed))}`.trim();
      }
    }

    finalizeCurrent();

    // Associate detected diagram/visual regions with questions
    this.associateDiagramsToQuestions(questions, detectedRegions);

    return questions;
  }

  /**
   * Deterministically associate visual diagram crops to the most relevant question
   * using spatial proximity, page matching, and figure references.
   */
  private associateDiagramsToQuestions(
    questions: QuestionAssemblyResult[],
    detectedRegions: DetectedRegion[]
  ): void {
    const visualRegions = detectedRegions.filter(
      (r) => (r.regionClass === "diagram" || r.regionClass === "graph") && r.cropAssetId
    );

    for (const region of visualRegions) {
      if (!region.cropAssetId) continue;

      // Find questions on the same page
      const samePageQuestions = questions.filter((q) => q.sourcePage === region.pageNumber);
      if (samePageQuestions.length === 0) {
        // Fallback: assign to first question if overall document
        if (questions.length > 0) {
          this.attachDiagram(questions[0], region);
        }
        continue;
      }

      // Check if any question explicitly refers to a diagram or figure
      const explicitMatch = samePageQuestions.find((q) =>
        /(?:চিত্র|উদ্দীপক|চিত্রটি|diagram|figure|graph|circuit)/iu.test(q.title)
      );

      if (explicitMatch) {
        this.attachDiagram(explicitMatch, region);
      } else if (samePageQuestions.length === 1) {
        // Unambiguous: only one question on this page
        this.attachDiagram(samePageQuestions[0], region);
      } else {
        // Ambiguous: multiple questions on the same page without explicit reference
        // Associate with first question on page but flag for human review
        this.attachDiagram(samePageQuestions[0], region);
        samePageQuestions[0].warnings.push(
          "Diagram association is ambiguous between multiple questions on this page. Please verify."
        );
        samePageQuestions[0].reviewRequired = true;
      }
    }
  }

  private attachDiagram(question: QuestionAssemblyResult, region: DetectedRegion): void {
    question.temporaryAssetId = region.cropAssetId;
    question.imageUrl = `/api/question-import/jobs/${region.cropAssetId ? region.cropAssetId.split("_")[0] : "temp"}/assets/${region.cropAssetId}`;
    if (!question.associatedRegionIds) question.associatedRegionIds = [];
    question.associatedRegionIds.push(region.id);
  }
}

export const questionAssembler = new QuestionAssembler();
