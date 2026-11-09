export type ImportType = "image" | "pdf" | "docx";

export type BoundingBox = {
  x: number; // Normalized [0, 1] relative to page width
  y: number; // Normalized [0, 1] relative to page height
  width: number; // Normalized [0, 1]
  height: number; // Normalized [0, 1]
};

export type PixelBoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type VisualRegionClass =
  | "question_text"
  | "diagram"
  | "graph"
  | "table"
  | "formula"
  | "header"
  | "footer"
  | "instruction";

export type DetectedRegion = {
  id: string;
  pageNumber: number;
  regionClass: VisualRegionClass;
  bbox: BoundingBox;
  confidence: number;
  cropAssetId?: string;
  associatedQuestionId?: string;
};

export type StructuralRole =
  | "QUESTION_START"
  | "QUESTION_TEXT"
  | "MCQ_OPTION"
  | "SUBQUESTION"
  | "INSTRUCTION"
  | "SECTION_HEADER"
  | "HEADER"
  | "FOOTER"
  | "FIGURE_REFERENCE"
  | "UNKNOWN";

export type RecognizedBlock = {
  id: string;
  pageNumber: number;
  text: string;
  rawText?: string;
  confidence: number;
  bbox: BoundingBox;
  role: StructuralRole;
  latex?: string;
  marks?: number | null;
  label?: string | null;
  readingOrderIndex: number;
  needsReview?: boolean;
};

export type TempAsset = {
  id: string;
  jobId: string;
  pageNumber: number;
  mimeType: string;
  buffer: Buffer;
  bbox: BoundingBox;
  pixelBbox?: PixelBoundingBox;
  filename: string;
  regionClass: VisualRegionClass;
  createdAt: number;
};

export type ExtractedPageLayout = {
  pageNumber: number;
  sourceName: string;
  width: number;
  height: number;
  text: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  isNativeText: boolean;
};

export type QuestionAssemblyResult = {
  id: string;
  number?: string | null;
  title: string;
  subtitle?: string | null;
  imageUrl?: string;
  temporaryAssetId?: string;
  marks: number;
  explanation?: string | null;
  type: "mcq" | "cq" | "written";
  options: string[];
  correct: number | null;
  subQuestions?: Array<{
    id: string;
    label?: string;
    text: string;
    marks: number;
    answer?: string | null;
    explanation?: string | null;
  }>;
  warnings: string[];
  confidence: {
    ocr: number;
    layout: number;
    structure: number;
    overall: number;
  };
  reviewRequired: boolean;
  sourcePage?: number;
  associatedRegionIds?: string[];
};

export type ExtractionJob = {
  id: string;
  userId: string;
  importType: ImportType;
  createdAt: number;
  expiresAt: number;
  status: "pending" | "processing" | "completed" | "failed";
  pages: ExtractedPageLayout[];
  regions: DetectedRegion[];
  questions: QuestionAssemblyResult[];
  warnings: string[];
  metrics: {
    totalPages: number;
    detectedRegionsCount: number;
    ocrExecutionTimeMs: number;
    totalPipelineTimeMs: number;
  };
};

export type ReviewedCorrection = {
  id: string;
  jobId: string;
  questionId: string;
  userId: string;
  originalText: string;
  correctedText: string;
  originalType: string;
  correctedType: string;
  originalOptions?: string[];
  correctedOptions?: string[];
  cropAssetId?: string;
  modelVersion: string;
  timestamp: string;
};
