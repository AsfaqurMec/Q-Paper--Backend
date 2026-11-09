import {
  extractCqSubQuestion,
  extractMarks,
  extractOptionsFromLine,
  isQuestionHeader
} from "../questionImport.parser.js";
import type { RecognizedBlock, StructuralRole } from "./types.js";

export class StructureClassifier {
  /**
   * Classify each recognized block into its structural document role.
   */
  classifyBlock(block: RecognizedBlock): RecognizedBlock {
    const trimmed = block.text.trim();
    if (!trimmed) {
      return { ...block, role: "UNKNOWN" };
    }

    // 1. Header & Footer checks
    if (/^page\s*\d+(\s*of\s*\d+)?$/i.test(trimmed) || /^পৃষ্ঠা\s*[\p{N}\u09e6-\u09ef\d]+/iu.test(trimmed)) {
      return { ...block, role: "FOOTER" };
    }
    if (/^(?:ঢাকা\s*বোর্ড|কুমিল্লা\s*বোর্ড|চট্টগ্রাম\s*বোর্ড|রাজশাহী\s*বোর্ড|বরিশাল\s*বোর্ড|সিলেট\s*বোর্ড|দিনাজপুর\s*বোর্ড|ময়মনসিংহ\s*বোর্ড|Board\s*Exam)/iu.test(trimmed)) {
      return { ...block, role: "HEADER" };
    }

    // 2. Section Headers
    if (
      /^(?:ক[- ]বিভাগ|খ[- ]বিভাগ|গ[- ]বিভাগ|ঘ[- ]বিভাগ|Section\s*[A-D]|Part\s*[A-D])/iu.test(trimmed) ||
      /^(?:বহুনির্বাচনি\s*প্রশ্ন|সৃজনশীল\s*প্রশ্ন|সংক্ষিপ্ত\s*প্রশ্ন|রচনামূলক\s*প্রশ্ন|Multiple\s*Choice|Creative\s*Questions)/iu.test(trimmed)
    ) {
      return { ...block, role: "SECTION_HEADER" };
    }

    // 3. Exam Instructions
    if (/^(?:বিশেষ\s*দ্রষ্টব্য|বি\.দ্র\.|সকল\s*প্রশ্নের\s*উত্তর\s*দাও|প্রতিটি\s*প্রশ্নের\s*মান|Instructions?|Note:)/iu.test(trimmed)) {
      return { ...block, role: "INSTRUCTION" };
    }

    // 4. Figure / Diagram References
    if (/^(?:চিত্র(?:টি)?\s*লক্ষ\s*কর|নিচের\s*চিত্রটি|উদ্দীপকের\s*চিত্র|Observe\s*the\s*diagram|Refer\s*to\s*the\s*figure)/iu.test(trimmed)) {
      return { ...block, role: "FIGURE_REFERENCE" };
    }

    // 5. Question Header / Boundary
    const headerRes = isQuestionHeader(trimmed);
    if (headerRes.isHeader) {
      return {
        ...block,
        role: "QUESTION_START",
        label: headerRes.number,
        marks: headerRes.marks
      };
    }

    // 6. CQ Subquestion (e.g. ক. ... [১] or a) ... [1])
    const cqSub = extractCqSubQuestion(trimmed);
    if (cqSub && (cqSub.hasExplicitMarks || /(?:কাকে\s*বলে|কী|কি|ব্যাখ্যা|নির্ণয়|বিশ্লেষণ|what|define|explain)/iu.test(trimmed))) {
      return {
        ...block,
        role: "SUBQUESTION",
        label: cqSub.label,
        marks: cqSub.marks
      };
    }

    // 7. MCQ Option
    const optRes = extractOptionsFromLine(trimmed);
    if (optRes.isOption) {
      return {
        ...block,
        role: "MCQ_OPTION"
      };
    }

    // 8. General Question Text
    return {
      ...block,
      role: "QUESTION_TEXT"
    };
  }

  /**
   * Determine the question type for an assembled question.
   */
  classifyQuestionType(
    subQuestionsCount: number,
    optionsCount: number,
    hasStemDirectives: boolean
  ): "mcq" | "cq" | "written" {
    if (subQuestionsCount > 0 || hasStemDirectives) {
      return "cq";
    }
    if (optionsCount >= 2) {
      return "mcq";
    }
    return "written";
  }
}

export const structureClassifier = new StructureClassifier();
