import Tesseract from "tesseract.js";
import { cleanupOcrText, repairBengaliSpacedGlyphs } from "../questionImport.chunker.js";
import type { ExtractedPageLayout, RecognizedBlock } from "./types.js";
import { nanoid } from "nanoid";

export type OcrResult = {
  text: string;
  rawText: string;
  confidence: number;
  blocks: RecognizedBlock[];
  isGarbled: boolean;
  warnings: string[];
};

export class OcrEngine {
  /**
   * Process a page through text extraction and OCR if needed.
   * If page has reliable native text (searchable PDF / DOCX), preserve it directly.
   * If page is scanned/image, execute bilingual OCR (Bengali + English).
   */
  async processPage(page: ExtractedPageLayout): Promise<OcrResult> {
    const warnings: string[] = [];

    // Case 1: Searchable document with native text
    if (page.text && page.text.trim().length > 0) {
      const repaired = repairBengaliSpacedGlyphs(page.text.trim());
      const cleaned = cleanupOcrText(repaired);
      const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);

      const blocks: RecognizedBlock[] = lines.map((line, idx) => ({
        id: `blk_${nanoid(8)}`,
        pageNumber: page.pageNumber,
        text: line.trim(),
        rawText: line,
        confidence: 0.99,
        bbox: { x: 0.05, y: idx / Math.max(lines.length, 1), width: 0.9, height: 1 / Math.max(lines.length, 1) },
        role: "UNKNOWN",
        readingOrderIndex: idx
      }));

      return {
        text: cleaned,
        rawText: page.text,
        confidence: 0.98,
        blocks,
        isGarbled: this.detectGarbledText(cleaned),
        warnings
      };
    }

    // Case 2: Scanned PDF or uploaded image requiring OCR
    if (page.imageBuffer && (page.mimeType?.startsWith("image/") || page.mimeType === "image/jpeg" || page.mimeType === "image/png")) {
      try {
        let rawOcrText = "";
        let meanConfidence = 0.85;

        const langPath = process.cwd();
        try {
          // Attempt bilingual recognition: Bengali + English using local traineddata
          const res = await Tesseract.recognize(page.imageBuffer, "ben+eng", { langPath });
          rawOcrText = res.data.text || "";
          meanConfidence = (res.data.confidence || 85) / 100;
        } catch {
          // Fallback to English OCR if Bengali traineddata is unavailable in local environment
          warnings.push("Bengali OCR dictionary unavailable; using English model fallback.");
          const res = await Tesseract.recognize(page.imageBuffer, "eng", { langPath });
          rawOcrText = res.data.text || "";
          meanConfidence = (res.data.confidence || 75) / 100;
        }

        const repaired = repairBengaliSpacedGlyphs(rawOcrText.trim());
        const cleaned = cleanupOcrText(repaired);
        const isGarbled = this.detectGarbledText(cleaned);

        if (isGarbled) {
          warnings.push(`Page ${page.pageNumber}: OCR detected potentially garbled text or low scan quality.`);
        }

        const lines = cleaned.split("\n").filter((l) => l.trim().length > 0);
        const blocks: RecognizedBlock[] = lines.map((line, idx) => ({
          id: `blk_${nanoid(8)}`,
          pageNumber: page.pageNumber,
          text: line.trim(),
          rawText: line,
          confidence: meanConfidence,
          bbox: { x: 0.05, y: idx / Math.max(lines.length, 1), width: 0.9, height: 1 / Math.max(lines.length, 1) },
          role: "UNKNOWN",
          readingOrderIndex: idx,
          needsReview: isGarbled || meanConfidence < 0.7
        }));

        return {
          text: cleaned,
          rawText: rawOcrText,
          confidence: meanConfidence,
          blocks,
          isGarbled,
          warnings
        };
      } catch (ocrErr) {
        warnings.push(`Page ${page.pageNumber}: OCR recognition error (${ocrErr instanceof Error ? ocrErr.message : String(ocrErr)})`);
        return {
          text: "",
          rawText: "",
          confidence: 0,
          blocks: [],
          isGarbled: true,
          warnings
        };
      }
    }

    return {
      text: "",
      rawText: "",
      confidence: 0,
      blocks: [],
      isGarbled: false,
      warnings: ["No text or image buffer available to recognize."]
    };
  }

  /**
   * Detect likely garbled text, non-printable characters, or severe scan artifacts
   */
  private detectGarbledText(text: string): boolean {
    if (!text || text.length < 5) return false;

    // High proportion of replacement characters or strange Unicode symbols
    const replacementChars = (text.match(/[\uFFFD\u0000-\u0008\u000E-\u001F]/g) || []).length;
    if (replacementChars > 3) return true;

    // Excessive non-alphanumeric punctuation clusters (e.g. "?!?$%###")
    const strangeClusters = (text.match(/[^a-zA-Z0-9\u0980-\u09FF\s.,;:()/\-–—=\[\]]{4,}/g) || []).length;
    return strangeClusters >= 2;
  }
}

export const ocrEngine = new OcrEngine();
