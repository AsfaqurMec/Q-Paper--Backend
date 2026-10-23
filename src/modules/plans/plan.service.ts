import type { PlanCode } from "../shared/types.js";

export type Plan = {
  code: string;
  name: string;
  price: number;
  interval: "lifetime" | "month" | "year" | "day" | string;
  duration?: string;
  durationDays?: number;
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
  description?: string;
  isActive?: boolean;
};

export const plans: Plan[] = [
  {
    code: "free",
    name: "Free",
    price: 0,
    interval: "month",
    duration: "লাইফটাইম",
    durationDays: 0,
    paperLimit: 2,
    questionLimit: 30,
    totalQuestionsLimit: 60,
    exports: ["pdf"],
    importQuestion: false,
    watermark: true,
    questionBank: false,
    branding: false,
    randomGenerator: false,
    multipleVersions: false,
    description: "সফটওয়্যার পরীক্ষা ও ফ্রি ট্রায়াল"
  },
  {
    code: "small",
    name: "Small",
    price: 100,
    interval: "month",
    duration: "৩০ দিন (১ মাস)",
    durationDays: 30,
    paperLimit: 100,
    questionLimit: 50,
    totalQuestionsLimit: 3500,
    exports: ["pdf"],
    importQuestion: false,
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true,
    description: "একক শিক্ষক ও টিউটরদের জন্য সেরা"
  },
  {
    code: "pro",
    name: "Pro",
    price: 500,
    interval: "month",
    duration: "৩০ দিন (১ মাস)",
    durationDays: 30,
    paperLimit: 2000,
    questionLimit: 200,
    totalQuestionsLimit: 7000,
    exports: ["pdf"],
    importQuestion: false,
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true,
    description: "ব্যক্তিগত শিক্ষক ও মাঝারি কোচিং"
  },
  {
    code: "ultra",
    name: "Ultra",
    price: 1000,
    interval: "month",
    duration: "৩০ দিন (১ মাস)",
    durationDays: 30,
    paperLimit: 5000,
    questionLimit: 500,
    totalQuestionsLimit: 15000,
    exports: ["pdf", "docx"],
    importQuestion: true,
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true,
    description: "বড় কোচিং ও ওয়ার্ড (.docx) এক্সপোর্ট"
  },
  {
    code: "diamond",
    name: "Diamond",
    price: 3500,
    interval: "month",
    duration: "৩০ দিন (১ মাস)",
    durationDays: 30,
    paperLimit: 999999,
    questionLimit: 999999,
    totalQuestionsLimit: 999999,
    exports: ["pdf", "docx"],
    importQuestion: true,
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true,
    description: "সম্পূর্ণ আনলিমিটেড পেপার ও প্রশ্ন, সুপার ভিআইপি"
  }
];

let cachedPlans: Plan[] = plans;

export function getPlan(code: PlanCode | string): Plan {
  // Alias legacy "standard" to "small"
  if (code === "standard") {
    const s = cachedPlans.find((p) => p.code === "small");
    if (s) return s;
  }
  return cachedPlans.find((plan) => plan.code === code) ?? cachedPlans[0] ?? plans[0];
}

export type PlanUsageAssertion = {
  papersThisMonth?: number;
  questionsInPaper?: number;
  totalQuestionsCreated?: number;
  exportFormat?: string;
  isImportAttempt?: boolean;
  multipleVersionsAttempt?: boolean;
  brandingAttempt?: boolean;
  questionBankAttempt?: boolean;
  randomGeneratorAttempt?: boolean;
};

export function assertWithinPlan(code: PlanCode | string, usage: PlanUsageAssertion) {
  const plan = getPlan(code);

  // Diamond plan has unlimited papers and unlimited questions
  if (plan.code === "diamond") {
    return { allowed: true, reason: "Allowed" };
  }

  if (usage.multipleVersionsAttempt && !plan.multipleVersions) {
    return {
      allowed: false,
      reason: "Multiple paper versions (Sets A, B, C, D) are only available in paid packages (Small, Pro, Ultra, Diamond). Please upgrade your package to generate and export paper sets."
    };
  }

  if (usage.brandingAttempt && !plan.branding) {
    return {
      allowed: false,
      reason: "Institute branding is only available in paid packages (Small, Pro, Ultra, Diamond). Please upgrade your package to enable institution logo and branding."
    };
  }

  if (usage.questionBankAttempt && !plan.questionBank) {
    return {
      allowed: false,
      reason: "Question Bank access is only available in paid packages (Small, Pro, Ultra, Diamond). Please upgrade your package to access the Question Bank."
    };
  }

  if (usage.randomGeneratorAttempt && !plan.randomGenerator) {
    return {
      allowed: false,
      reason: "Random Paper Generator is only available in paid packages (Small, Pro, Ultra, Diamond). Please upgrade your package to use automatic paper generation."
    };
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

export function canUseMultipleVersions(code: PlanCode | string): boolean {
  return Boolean(getPlan(code).multipleVersions);
}

export function canUseBranding(code: PlanCode | string): boolean {
  return Boolean(getPlan(code).branding);
}

export function canExportFormat(code: PlanCode | string, format: string): boolean {
  const plan = getPlan(code);
  return plan.exports.includes(format.toLowerCase() as any);
}

export function canUseQuestionBank(code: PlanCode | string): boolean {
  return Boolean(getPlan(code).questionBank);
}

export function canUseRandomGenerator(code: PlanCode | string): boolean {
  return Boolean(getPlan(code).randomGenerator);
}

export function canImportQuestions(code: PlanCode | string): boolean {
  return Boolean(getPlan(code).importQuestion);
}

export async function getDbPlans(): Promise<Plan[]> {
  try {
    const { PlanModel } = await import("./plan.models.js");
    let dbPlans = await PlanModel.find({ isActive: { $ne: false } }).lean();

    // If database has no plans at all, seed with default plans
    if (!dbPlans || dbPlans.length === 0) {
      const timestamp = new Date().toISOString();
      const docsToInsert = plans.map((p) => ({
        id: `plan_${p.code}`,
        ...p,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp
      }));
      await PlanModel.insertMany(docsToInsert);
      dbPlans = await PlanModel.find({ isActive: { $ne: false } }).lean();
    }

    if (dbPlans && dbPlans.length > 0) {
      const order = ["free", "small", "pro", "ultra", "diamond"];
      const loaded: Plan[] = dbPlans
        .sort((a, b) => {
          const indexA = order.indexOf(a.code);
          const indexB = order.indexOf(b.code);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return (a.price || 0) - (b.price || 0);
        })
        .map((p) => ({
          code: p.code,
          name: p.name,
          price: p.price,
          interval: p.interval as any,
          duration: p.duration || (p.price === 0 ? "লাইফটাইম" : "৩০ দিন (১ মাস)"),
          durationDays: typeof p.durationDays === "number" ? p.durationDays : (p.price === 0 ? 0 : 30),
          paperLimit: p.paperLimit,
          questionLimit: p.questionLimit,
          totalQuestionsLimit: p.totalQuestionsLimit,
          exports: (p.exports as any) || ["pdf"],
          importQuestion: p.importQuestion ?? false,
          watermark: p.watermark ?? false,
          questionBank: p.questionBank ?? true,
          branding: p.branding ?? true,
          randomGenerator: p.randomGenerator ?? true,
          multipleVersions: p.multipleVersions ?? true,
          description: p.description || "",
          isActive: p.isActive !== false
        }));
      cachedPlans = loaded;
      return loaded;
    }
  } catch (error) {
    console.error("Failed to read plans from DB, falling back to static plans:", error);
  }
  return cachedPlans;
}

export async function createDbPlan(input: Partial<Plan>): Promise<Plan> {
  const { PlanModel } = await import("./plan.models.js");
  const code = (input.code || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  if (!code) {
    throw new Error("Plan code is required (e.g. starter, premium)");
  }
  const existing = await PlanModel.findOne({ code });
  if (existing) {
    throw new Error(`A plan with code '${code}' already exists.`);
  }

  const timestamp = new Date().toISOString();
  const newPlan: Plan = {
    code,
    name: input.name?.trim() || code.toUpperCase(),
    price: Math.max(0, Number(input.price) || 0),
    interval: input.interval || "month",
    duration: input.duration?.trim() || "৩০ দিন",
    durationDays: typeof input.durationDays === "number" ? input.durationDays : 30,
    paperLimit: Math.max(1, Number(input.paperLimit) || 100),
    questionLimit: Math.max(1, Number(input.questionLimit) || 50),
    totalQuestionsLimit: Math.max(1, Number(input.totalQuestionsLimit) || 3500),
    exports: Array.isArray(input.exports) && input.exports.length > 0 ? (input.exports as any) : ["pdf"],
    importQuestion: Boolean(input.importQuestion),
    watermark: Boolean(input.watermark),
    questionBank: input.questionBank !== false,
    branding: input.branding !== false,
    randomGenerator: input.randomGenerator !== false,
    multipleVersions: input.multipleVersions !== false,
    description: input.description || "",
    isActive: input.isActive !== false
  };

  await PlanModel.create({
    id: `plan_${code}`,
    ...newPlan,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  await getDbPlans();
  return newPlan;
}

export async function updateDbPlan(codeOrId: string, input: Partial<Plan>): Promise<Plan> {
  const { PlanModel } = await import("./plan.models.js");
  const plan = await PlanModel.findOne({ $or: [{ code: codeOrId }, { id: codeOrId }] });
  if (!plan) {
    throw new Error(`Plan '${codeOrId}' not found.`);
  }

  if (input.name !== undefined) plan.name = input.name.trim();
  if (input.price !== undefined) plan.price = Math.max(0, Number(input.price));
  if (input.interval !== undefined) plan.interval = input.interval;
  if (input.duration !== undefined) plan.duration = input.duration.trim();
  if (input.durationDays !== undefined) plan.durationDays = Number(input.durationDays);
  if (input.paperLimit !== undefined) plan.paperLimit = Math.max(1, Number(input.paperLimit));
  if (input.questionLimit !== undefined) plan.questionLimit = Math.max(1, Number(input.questionLimit));
  if (input.totalQuestionsLimit !== undefined) plan.totalQuestionsLimit = Math.max(1, Number(input.totalQuestionsLimit));
  if (input.exports !== undefined) plan.exports = input.exports as any;
  if (input.importQuestion !== undefined) plan.importQuestion = Boolean(input.importQuestion);
  if (input.watermark !== undefined) plan.watermark = Boolean(input.watermark);
  if (input.questionBank !== undefined) plan.questionBank = Boolean(input.questionBank);
  if (input.branding !== undefined) plan.branding = Boolean(input.branding);
  if (input.randomGenerator !== undefined) plan.randomGenerator = Boolean(input.randomGenerator);
  if (input.multipleVersions !== undefined) plan.multipleVersions = Boolean(input.multipleVersions);
  if (input.description !== undefined) plan.description = input.description;
  if (input.isActive !== undefined) plan.isActive = Boolean(input.isActive);
  plan.updatedAt = new Date().toISOString();

  await plan.save();
  await getDbPlans();
  return plan.toObject() as Plan;
}

export async function deleteDbPlan(codeOrId: string): Promise<boolean> {
  const { PlanModel } = await import("./plan.models.js");
  const plan = await PlanModel.findOne({ $or: [{ code: codeOrId }, { id: codeOrId }] });
  if (!plan) {
    throw new Error(`Plan '${codeOrId}' not found.`);
  }
  if (plan.code === "free") {
    throw new Error("The default Free plan cannot be deleted.");
  }

  await PlanModel.deleteOne({ id: plan.id });
  await getDbPlans();
  return true;
}
