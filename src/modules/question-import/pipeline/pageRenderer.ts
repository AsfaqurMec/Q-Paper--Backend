import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import type { ExtractedPageLayout, ImportType } from "./types.js";

export type RawUploadFile = {
  name: string;
  mimeType?: string;
  dataUrl: string;
};

export class PageRenderer {
  /**
   * Process raw upload files and return normalized ExtractedPageLayout structures.
   */
  async processFiles(importType: ImportType, files: RawUploadFile[]): Promise<{
    pages: ExtractedPageLayout[];
    warnings: string[];
  }> {
    const pages: ExtractedPageLayout[] = [];
    const warnings: string[] = [];

    for (let fIdx = 0; fIdx < files.length; fIdx++) {
      const file = files[fIdx];
      const buffer = this.dataUrlToBuffer(file.dataUrl);

      if (importType === "docx") {
        const docxRes = await this.extractDocx(file.name, buffer, pages.length);
        pages.push(...docxRes.pages);
        warnings.push(...docxRes.warnings);
      } else if (importType === "pdf") {
        const pdfRes = await this.extractPdf(file.name, buffer, pages.length);
        pages.push(...pdfRes.pages);
        warnings.push(...pdfRes.warnings);
      } else if (importType === "image") {
        const imgPage = this.extractImage(file.name, buffer, file.mimeType, pages.length + 1);
        pages.push(imgPage);
      }
    }

    return { pages, warnings };
  }

  private extractImage(name: string, buffer: Buffer, mimeType?: string, pageNumber = 1): ExtractedPageLayout {
    const resolvedMime = mimeType || (name.endsWith(".png") ? "image/png" : "image/jpeg");
    // Standard normalized dimensions for image coordinate system (default 1200x1600 if unmeasured)
    return {
      pageNumber,
      sourceName: name,
      width: 1200,
      height: 1600,
      text: "",
      imageBuffer: buffer,
      mimeType: resolvedMime,
      isNativeText: false
    };
  }

  private async extractPdf(
    sourceName: string,
    buffer: Buffer,
    pageOffset: number
  ): Promise<{ pages: ExtractedPageLayout[]; warnings: string[] }> {
    const warnings: string[] = [];
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      const rawPages = result.pages || [];

      // Determine if PDF is searchable or scanned (empty or minimal text)
      const pdfPages: ExtractedPageLayout[] = rawPages.map((page, idx) => {
        const pageText = (page.text || "").trim();
        const isSearchable = pageText.length > 30; // Has significant text stream

        return {
          pageNumber: pageOffset + (page.num || idx + 1),
          sourceName,
          width: 595, // Standard A4 width in points
          height: 842, // Standard A4 height in points
          text: pageText,
          imageBuffer: isSearchable ? undefined : buffer, // Flag for OCR when scanned
          mimeType: "application/pdf",
          isNativeText: isSearchable
        };
      });

      if (pdfPages.length === 0) {
        // Fallback for single page or un-indexed PDF stream
        const fullText = (result.text || "").trim();
        pdfPages.push({
          pageNumber: pageOffset + 1,
          sourceName,
          width: 595,
          height: 842,
          text: fullText,
          imageBuffer: buffer,
          mimeType: "application/pdf",
          isNativeText: fullText.length > 30
        });
      }

      return { pages: pdfPages, warnings };
    } catch (error) {
      warnings.push(`${sourceName}: PDF extraction failed (${error instanceof Error ? error.message : String(error)})`);
      return {
        pages: [
          {
            pageNumber: pageOffset + 1,
            sourceName,
            width: 595,
            height: 842,
            text: "",
            imageBuffer: buffer,
            mimeType: "application/pdf",
            isNativeText: false
          }
        ],
        warnings
      };
    } finally {
      await parser.destroy();
    }
  }

  private async extractDocx(
    sourceName: string,
    buffer: Buffer,
    pageOffset: number
  ): Promise<{ pages: ExtractedPageLayout[]; warnings: string[] }> {
    const warnings: string[] = [];
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value || "";
      warnings.push(...result.messages.map((m) => `${sourceName}: ${m.message}`));

      // Split DOCX into logical pages if form-feed exists, or create a single page
      const parts = text.split(/\f|\n{6,}/).map((p) => p.trim()).filter(Boolean);
      const pages: ExtractedPageLayout[] = (parts.length > 0 ? parts : [text]).map((chunk, idx) => ({
        pageNumber: pageOffset + idx + 1,
        sourceName,
        width: 800,
        height: 1100,
        text: chunk,
        isNativeText: true
      }));

      return { pages, warnings };
    } catch (error) {
      warnings.push(`${sourceName}: DOCX extraction failed (${error instanceof Error ? error.message : String(error)})`);
      return { pages: [], warnings };
    }
  }

  dataUrlToBuffer(dataUrl: string): Buffer {
    const [, base64 = ""] = dataUrl.split(",");
    return Buffer.from(base64, "base64");
  }
}

export const pageRenderer = new PageRenderer();
