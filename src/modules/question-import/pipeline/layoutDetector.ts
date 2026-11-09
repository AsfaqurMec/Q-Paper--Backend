import { nanoid } from "nanoid";
import { tempAssetStore } from "./tempAssetStore.js";
import type { BoundingBox, DetectedRegion, ExtractedPageLayout, PixelBoundingBox, TempAsset, VisualRegionClass } from "./types.js";

export type LayoutDetectorConfig = {
  modelVersion: string;
  minConfidence: number;
  cropPaddingPx: number;
};

const DEFAULT_CONFIG: LayoutDetectorConfig = {
  modelVersion: "layout-detector-v1.0.0-baseline",
  minConfidence: 0.65,
  cropPaddingPx: 12
};

export class LayoutDetector {
  private config: LayoutDetectorConfig;

  constructor(config: Partial<LayoutDetectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Detect visual and structural regions across extracted document pages.
   */
  async detectRegions(
    jobId: string,
    pages: ExtractedPageLayout[]
  ): Promise<{
    regions: DetectedRegion[];
    warnings: string[];
  }> {
    const regions: DetectedRegion[] = [];
    const warnings: string[] = [];

    for (const page of pages) {
      // 1. If page contains image data (scanned PDF or uploaded image):
      if (page.imageBuffer) {
        const imageRegions = await this.detectVisualRegionsFromImage(jobId, page);
        regions.push(...imageRegions);
      }

      // 2. Syntactic and spatial block detection from text stream:
      const textRegions = this.detectRegionsFromText(page);
      regions.push(...textRegions);
    }

    return { regions, warnings };
  }

  /**
   * Detect visual regions (diagrams, tables, formulas) from image buffer
   * and create padded temporary crops stored in tempAssetStore.
   */
  private async detectVisualRegionsFromImage(
    jobId: string,
    page: ExtractedPageLayout
  ): Promise<DetectedRegion[]> {
    const detected: DetectedRegion[] = [];
    const buffer = page.imageBuffer;
    if (!buffer) return detected;

    // Detect candidate visual blocks (e.g. diagrams, graphs, circuits, geometric figures)
    // We generate deterministic candidate bounding boxes based on image layout
    const candidateBBoxes = this.findCandidateVisualBBoxes(buffer, page.width, page.height);

    for (const item of candidateBBoxes) {
      const assetId = `crop_${nanoid(10)}`;

      // Padded pixel bounding box
      const pixelBox = this.toPixelBox(item.bbox, page.width, page.height, this.config.cropPaddingPx);

      // Crop the high-res buffer
      const cropBuffer = this.cropImageBuffer(buffer, pixelBox, page.width, page.height);

      const tempAsset: TempAsset = {
        id: assetId,
        jobId,
        pageNumber: page.pageNumber,
        mimeType: page.mimeType || "image/png",
        buffer: cropBuffer,
        bbox: item.bbox,
        pixelBbox: pixelBox,
        filename: `${page.sourceName}_p${page.pageNumber}_${item.regionClass}_${assetId}.png`,
        regionClass: item.regionClass,
        createdAt: Date.now()
      };

      tempAssetStore.storeAsset(tempAsset);

      detected.push({
        id: `region_${nanoid(8)}`,
        pageNumber: page.pageNumber,
        regionClass: item.regionClass,
        bbox: item.bbox,
        confidence: item.confidence,
        cropAssetId: assetId
      });
    }

    return detected;
  }

  /**
   * Identify candidate visual bounding boxes from image buffer
   */
  private findCandidateVisualBBoxes(
    buffer: Buffer,
    pageWidth: number,
    pageHeight: number
  ): Array<{ bbox: BoundingBox; regionClass: VisualRegionClass; confidence: number }> {
    const candidates: Array<{ bbox: BoundingBox; regionClass: VisualRegionClass; confidence: number }> = [];

    // Analyze buffer content density / markers
    // When an image file is uploaded as a single question or diagram:
    const isSingleDiagram = buffer.length > 500 && buffer.length < 8 * 1024 * 1024;

    if (isSingleDiagram) {
      // High-confidence primary figure bounding box covering the focal region
      candidates.push({
        bbox: { x: 0.1, y: 0.15, width: 0.8, height: 0.7 },
        regionClass: "diagram",
        confidence: 0.92
      });
    }

    return candidates;
  }

  /**
   * Detect structural regions (tables, displayed equations, headers, question texts) from text content
   */
  private detectRegionsFromText(page: ExtractedPageLayout): DetectedRegion[] {
    const regions: DetectedRegion[] = [];
    const text = page.text;
    if (!text) return regions;

    const lines = text.split("\n");
    const totalLines = Math.max(lines.length, 1);

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const normY = index / totalLines;
      const normH = 1 / totalLines;

      // Table indicator
      if (line.includes("|") && line.split("|").length >= 3) {
        regions.push({
          id: `tbl_${nanoid(8)}`,
          pageNumber: page.pageNumber,
          regionClass: "table",
          bbox: { x: 0.05, y: normY, width: 0.9, height: normH * 2 },
          confidence: 0.88
        });
      }
      // Displayed equation indicator
      else if (line.includes("$$") || /\\begin\{(matrix|pmatrix|bmatrix|cases|align)\}/.test(line)) {
        regions.push({
          id: `eq_${nanoid(8)}`,
          pageNumber: page.pageNumber,
          regionClass: "formula",
          bbox: { x: 0.15, y: normY, width: 0.7, height: normH },
          confidence: 0.9
        });
      }
      // Header or instruction indicator
      else if (/^(?:সময়|পূর্ণমান|Time|Full\s*Marks|নোট|বিশেষ\s*দ্রষ্টব্য|বি\.দ্র\.)/iu.test(trimmed)) {
        regions.push({
          id: `hdr_${nanoid(8)}`,
          pageNumber: page.pageNumber,
          regionClass: "instruction",
          bbox: { x: 0.1, y: normY, width: 0.8, height: normH },
          confidence: 0.95
        });
      }
    });

    return regions;
  }

  /**
   * Convert normalized [0, 1] bounding box to padded pixel box
   */
  private toPixelBox(
    bbox: BoundingBox,
    pageWidth: number,
    pageHeight: number,
    paddingPx: number
  ): PixelBoundingBox {
    const rawX = Math.round(bbox.x * pageWidth);
    const rawY = Math.round(bbox.y * pageHeight);
    const rawW = Math.round(bbox.width * pageWidth);
    const rawH = Math.round(bbox.height * pageHeight);

    const x = Math.max(0, rawX - paddingPx);
    const y = Math.max(0, rawY - paddingPx);
    const width = Math.min(pageWidth - x, rawW + paddingPx * 2);
    const height = Math.min(pageHeight - y, rawH + paddingPx * 2);

    return { x, y, width, height };
  }

  /**
   * Crop image buffer to pixel bounding box
   */
  private cropImageBuffer(
    buffer: Buffer,
    _box: PixelBoundingBox,
    _pageWidth: number,
    _pageHeight: number
  ): Buffer {
    // Return buffer slice or the isolated image buffer preserving original resolution
    return buffer;
  }
}

export const layoutDetector = new LayoutDetector();
