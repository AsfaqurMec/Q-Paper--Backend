import type { PlanCode } from "../shared/types.js";

export type Plan = {
  code: PlanCode;
  name: string;
  price: number;
  interval: "lifetime" | "month";
  paperLimit: number;
  questionLimit: number;
  totalQuestionsLimit: number;
  exports: Array<"pdf" | "docx">;
  importQuestion: boolean;
  watermark: boolean;
  questionBank: boolean;
  branding: boolean;
  randomGenerator: boolean;
  multipleVersions: boolean;
};

export const plans: Plan[] = [
  {
    code: "free",
    name: "Free",
    price: 0,
    interval: "month",
    paperLimit: 2,
    questionLimit: 30,
    totalQuestionsLimit: 60,
    exports: ["pdf"],
    importQuestion: false,
    watermark: true,
    questionBank: false,
    branding: false,
    randomGenerator: false,
    multipleVersions: false
  },
  {
    code: "small",
    name: "Small",
    price: 100,
    interval: "month",
    paperLimit: 100,
    questionLimit: 50,
    totalQuestionsLimit: 3500,
    exports: ["pdf"],
    importQuestion: false,
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true
  },
  {
    code: "pro",
    name: "Pro",
    price: 500,
    interval: "month",
    paperLimit: 2000,
    questionLimit: 200,
    totalQuestionsLimit: 7000,
    exports: ["pdf"],
    importQuestion: false,
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true
  },
  {
    code: "ultra",
    name: "Ultra",
    price: 1000,
    interval: "month",
    paperLimit: 5000,
    questionLimit: 500,
    totalQuestionsLimit: 15000,
    exports: ["pdf", "docx"],
    importQuestion: true,
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true
  },
  {
    code: "diamond",
    name: "Diamond",
    price: 3500,
    interval: "month",
    paperLimit: 999999,
    questionLimit: 999999,
    totalQuestionsLimit: 999999,
    exports: ["pdf", "docx"],
    importQuestion: true,
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true
  }
];

export function getPlan(code: PlanCode | string): Plan {
  // Alias legacy "standard" to "small"
  if (code === "standard") return plans[1];
  return plans.find((plan) => plan.code === code) ?? plans[0];
}

export type PlanUsageAssertion = {
  papersThisMonth?: number;
  questionsInPaper?: number;
  totalQuestionsCreated?: number;
  exportFormat?: string;
  isImportAttempt?: boolean;
};

export function assertWithinPlan(code: PlanCode | string, usage: PlanUsageAssertion) {
  const plan = getPlan(code);

  // Diamond plan has unlimited papers and unlimited questions
  if (plan.code === "diamond") {
    return { allowed: true, reason: "Allowed" };
  }

  if (usage.isImportAttempt && !plan.importQuestion) {
    return {
      allowed: false,
      reason: "The Question Import feature is only available in the Ultra package or Diamond package. Please upgrade to Ultra or Diamond to import questions from documents and images."
    };
  }

  if (usage.exportFormat) {
    const requestedFormat = usage.exportFormat.toLowerCase() as "pdf" | "docx";
    if (!plan.exports.includes(requestedFormat)) {
      return {
        allowed: false,
        reason: `${requestedFormat.toUpperCase()} export is only available in the Ultra package or Diamond package. Please upgrade to Ultra or Diamond to export in ${requestedFormat.toUpperCase()} format.`
      };
    }
  }

  if (usage.papersThisMonth !== undefined && usage.papersThisMonth >= plan.paperLimit) {
    const upgradeSuggestion =
      plan.code === "free"
        ? "Please upgrade to Small, Pro, Ultra or Diamond to create more papers."
        : plan.code === "small"
        ? "Please upgrade to Pro, Ultra or Diamond to create more papers."
        : plan.code === "pro"
        ? "Please upgrade to Ultra or Diamond to create more papers."
        : "Please upgrade to Diamond for unlimited question papers.";
    return {
      allowed: false,
      reason: `${plan.name} package question paper limit reached (maximum ${plan.paperLimit.toLocaleString()} question papers). ${upgradeSuggestion}`
    };
  }

  if (usage.questionsInPaper !== undefined && usage.questionsInPaper > plan.questionLimit) {
    return {
      allowed: false,
      reason: `${plan.name} package allows a maximum of ${plan.questionLimit} questions per question paper. Please upgrade your package to Diamond for unlimited questions.`
    };
  }

  if (usage.totalQuestionsCreated !== undefined && usage.totalQuestionsCreated > plan.totalQuestionsLimit) {
    const upgradeSuggestion =
      plan.code === "free"
        ? "Please upgrade to Small, Pro, Ultra or Diamond to create more questions."
        : plan.code === "small"
        ? "Please upgrade to Pro, Ultra or Diamond to create more questions."
        : plan.code === "pro"
        ? "Please upgrade to Ultra or Diamond to create more questions."
        : "Please upgrade to Diamond for unlimited questions.";
    return {
      allowed: false,
      reason: `${plan.name} package quota reached (${plan.totalQuestionsLimit.toLocaleString()} questions limit). ${upgradeSuggestion}`
    };
  }

  return { allowed: true, reason: "Allowed" };
}

export async function getDbPlans(): Promise<Plan[]> {
  try {
    const { PlanModel } = await import("./plan.models.js");
    const dbPlans = await PlanModel.find({ code: { $in: ["free", "small", "pro", "ultra", "diamond"] } }).lean();
    if (dbPlans && dbPlans.length >= 4) {
      const order = ["free", "small", "pro", "ultra", "diamond"];
      return dbPlans
        .sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code))
        .map((p) => ({
          code: p.code,
          name: p.name,
          price: p.price,
          interval: p.interval as any,
          paperLimit: p.paperLimit,
          questionLimit: p.questionLimit,
          totalQuestionsLimit: p.totalQuestionsLimit,
          exports: p.exports as any,
          importQuestion: p.importQuestion ?? false,
          watermark: p.watermark ?? false,
          questionBank: p.questionBank ?? true,
          branding: p.branding ?? true,
          randomGenerator: p.randomGenerator ?? true,
          multipleVersions: p.multipleVersions ?? true
        }));
    }
  } catch (error) {
    console.error("Failed to read plans from DB, falling back to static plans:", error);
  }
  return plans;
}
