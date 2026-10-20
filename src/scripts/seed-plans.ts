import mongoose, { Schema } from "mongoose";
import { env } from "../config/env.js";

const plansData = [
  {
    id: "plan_free",
    code: "free",
    name: "Free",
    price: 0,
    interval: "month",
    paperLimit: 2,
    questionLimit: 30,
    totalQuestionsLimit: 60,
    exports: ["pdf"],
    watermark: true,
    questionBank: false,
    branding: false,
    randomGenerator: false,
    multipleVersions: false,
    importQuestion: false
  },
  {
    id: "plan_small",
    code: "small",
    name: "Small",
    price: 100,
    interval: "month",
    paperLimit: 100,
    questionLimit: 50,
    totalQuestionsLimit: 3500,
    exports: ["pdf"],
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true,
    importQuestion: false
  },
  {
    id: "plan_pro",
    code: "pro",
    name: "Pro",
    price: 500,
    interval: "month",
    paperLimit: 2000,
    questionLimit: 200,
    totalQuestionsLimit: 7000,
    exports: ["pdf"],
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true,
    importQuestion: false
  },
  {
    id: "plan_ultra",
    code: "ultra",
    name: "Ultra",
    price: 1000,
    interval: "month",
    paperLimit: 5000,
    questionLimit: 500,
    totalQuestionsLimit: 15000,
    exports: ["pdf", "docx"],
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true,
    importQuestion: true
  },
  {
    id: "plan_diamond",
    code: "diamond",
    name: "Diamond",
    price: 3500,
    interval: "month",
    paperLimit: 999999,
    questionLimit: 999999,
    totalQuestionsLimit: 999999,
    exports: ["pdf", "docx"],
    watermark: false,
    questionBank: true,
    branding: true,
    randomGenerator: true,
    multipleVersions: true,
    importQuestion: true
  }
];

async function run() {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI not found in env");
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected successfully!");

  const planSchema = new Schema({}, { strict: false, versionKey: false });
  const Plan = mongoose.models.SeedPlan || mongoose.model("SeedPlan", planSchema, "plans");

  const timestamp = new Date().toISOString();

  console.log("Upserting plans to 'plans' collection in MongoDB...");
  for (const plan of plansData) {
    const res = await Plan.findOneAndUpdate(
      { code: plan.code },
      { $set: { ...plan, updatedAt: timestamp } },
      { upsert: true, new: true }
    );
    console.log(`Saved plan: ${plan.code} (${plan.name}) -> Price: ৳${plan.price}, Paper Limit: ${plan.paperLimit}, Question Limit: ${plan.totalQuestionsLimit}`);
  }

  // Remove any obsolete plan like legacy 'standard'
  const deleteResult = await Plan.deleteMany({ code: { $nin: ["free", "small", "pro", "ultra", "diamond"] } });
  if (deleteResult.deletedCount > 0) {
    console.log(`Deleted ${deleteResult.deletedCount} legacy/obsolete plans.`);
  }

  // Print all plans currently in DB
  const allDbPlans = await Plan.find().lean();
  console.log("\nCurrent active plans in DB count:", allDbPlans.length);
  console.log(JSON.stringify(allDbPlans.map((p: any) => ({ code: p.code, name: p.name, price: p.price, paperLimit: p.paperLimit, totalQuestionsLimit: p.totalQuestionsLimit, exports: p.exports, importQuestion: p.importQuestion })), null, 2));

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
