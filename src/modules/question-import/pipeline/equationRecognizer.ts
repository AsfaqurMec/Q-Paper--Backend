import { repairLatexEscapes, formatStemFormulas } from "../questionImport.parser.js";

export type EquationRecognitionResult = {
  type: "equation";
  text: string;
  latex: string;
  sourcePage?: number;
  needsReview: boolean;
  confidence: number;
};

export class EquationRecognizer {
  /**
   * Recognizes and standardizes mathematical and chemical expressions into clean LaTeX.
   */
  recognizeExpression(rawExpression: string, sourcePage = 1): EquationRecognitionResult {
    let cleaned = rawExpression.trim();
    cleaned = repairLatexEscapes(cleaned);

    // 1. Fractions: convert stacked or linear fractions to \frac{a}{b}
    cleaned = cleaned.replace(/(\b\d+|[a-zA-Z])\s*\/\s*(\b\d+|[a-zA-Z])/g, "\\frac{$1}{$2}");

    // 2. Unicode superscripts to LaTeX powers
    cleaned = cleaned
      .replace(/²/g, "^2")
      .replace(/³/g, "^3")
      .replace(/⁴/g, "^4")
      .replace(/ⁿ/g, "^n");

    // 3. Square roots: √x or √(expr) to \sqrt{expr}
    cleaned = cleaned
      .replace(/√\(([^)]+)\)/g, "\\sqrt{$1}")
      .replace(/√([0-9a-zA-Z]+)/g, "\\sqrt{$1}");

    // 4. Arithmetic and relational symbols to LaTeX
    cleaned = cleaned
      .replace(/×/g, "\\times ")
      .replace(/÷/g, "\\div ")
      .replace(/≤/g, "\\le ")
      .replace(/≥/g, "\\ge ")
      .replace(/≠/g, "\\ne ")
      .replace(/±/g, "\\pm ")
      .replace(/→/g, "\\rightarrow ")
      .replace(/⇌/g, "\\rightleftharpoons ");

    // 5. Greek symbols
    cleaned = cleaned
      .replace(/θ/g, "\\theta ")
      .replace(/λ/g, "\\lambda ")
      .replace(/π/g, "\\pi ")
      .replace(/Ω/g, "\\Omega ")
      .replace(/α/g, "\\alpha ")
      .replace(/β/g, "\\beta ")
      .replace(/γ/g, "\\gamma ")
      .replace(/Δ/g, "\\Delta ");

    // 6. Chemical formula subscripts: H2O -> H_2O, CaCO3 -> CaCO_3, etc.
    cleaned = cleaned.replace(/([A-Z][a-z]?)([2-9]|\d{2,})/g, "$1_{$2}");

    // Wrap in standard KaTeX math format
    const formatted = formatStemFormulas(cleaned);

    // Determine recognition confidence
    const hasUnclosedBrace = (cleaned.match(/\{/g) || []).length !== (cleaned.match(/\}/g) || []).length;
    const confidence = hasUnclosedBrace ? 0.5 : 0.95;

    return {
      type: "equation",
      text: rawExpression,
      latex: formatted,
      sourcePage,
      needsReview: hasUnclosedBrace || confidence < 0.8,
      confidence
    };
  }

  /**
   * Process mixed text to detect inline equations and format them safely.
   */
  processTextEquations(text: string): string {
    if (!text) return "";
    let processed = repairLatexEscapes(text);
    processed = formatStemFormulas(processed);
    return processed;
  }
}

export const equationRecognizer = new EquationRecognizer();
