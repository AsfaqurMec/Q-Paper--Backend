import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase() {
  if (!env.MONGODB_URI) {
    console.warn("MONGODB_URI is not set. API will run with mock responses for local exploration.");
    return;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== "production"
  });
  console.log("MongoDB connected");
}
