export type PlanCode = "free" | "small" | "pro" | "ultra" | "diamond" | "standard";

export type PaperStatus = "draft" | "published" | "archived";

export type QuestionType = "mcq" | "cq";

export type LayoutType = "single" | "split";

export type Question = {
  id: string;
  number?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  marks: number;
  explanation?: string;
  type: QuestionType;
  options: Array<{ id: string; label: string; text: string; isCorrect: boolean }>;
  subQuestions?: Array<{ id: string; label?: string; text: string; marks: number; answer?: string; explanation?: string }>;
};

export type Paper = {
  id: string;
  ownerId: string;
  classId?: string;
  subjectId?: string;
  name: string;
  subject: string;
  className: string;
  examType: string;
  duration: string;
  totalMarks: number;
  institute?: string;
  instituteLogo?: string;
  instituteBranding?: boolean;
  instructions?: string;
  questionNumberStyle: "numeric" | "upper-alpha" | "lower-alpha" | "roman";
  optionLabelStyle: "upper-alpha" | "bangla" | "lower-alpha" | "numeric";
  questionsPerPage: number;
  layout: LayoutType;
  cqLayout?: LayoutType;
  setName?: string;
  mcqSectionTitle?: string;
  cqSectionTitle?: string;
  sectionFlow?: "separate" | "single";
  status: PaperStatus;
  questions: Question[];
  createdAt: string;
  createdAtDate?: Date;
  updatedAt: string;
};
