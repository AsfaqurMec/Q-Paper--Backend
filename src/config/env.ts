import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  MONGODB_URI: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().default("dev-access-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().default("dev-refresh-secret-change-me"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("30d"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.6-flash"),
  GEMINI_RETRY_COUNT: z.coerce.number().int().min(0).max(5).default(2),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(45000),
  GEMINI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0),
  GEMINI_TOP_P: z.coerce.number().min(0).max(1).default(0.1),
  GEMINI_TOP_K: z.coerce.number().int().min(1).max(40).default(1),
  PARSER_CHUNK_SIZE: z.coerce.number().int().min(1000).max(20000).default(4000),
  PARSER_MAX_PAGES_PER_CHUNK: z.coerce.number().int().min(1).max(5).default(2),
  PARSER_CONCURRENCY: z.coerce.number().int().min(1).max(10).default(3),
  PARSER_VERIFICATION_ENABLED: z.coerce.boolean().default(true),
  PARSER_DEBUG: z.coerce.boolean().default(false),
  OPENAI_API_KEY: z.string().optional(),
  SERVER_URL: z.string().optional(),
  RENDER_EXTERNAL_URL: z.string().optional(),
  KEEP_ALIVE_ENABLED: z
    .preprocess((val) => {
      if (typeof val === "string") {
        const lower = val.toLowerCase().trim();
        if (lower === "false" || lower === "0" || lower === "off") return false;
      }
      return val;
    }, z.coerce.boolean())
    .default(true),
  KEEP_ALIVE_INTERVAL_MINUTES: z.coerce.number().default(10)
});

import { isPlaceholderSecret } from "../utils/security.js";

const parsed = envSchema.parse(process.env);

if (parsed.NODE_ENV === "production") {
  if (isPlaceholderSecret(parsed.JWT_ACCESS_SECRET)) {
    throw new Error(
      "FATAL SECURITY CONFIGURATION: Insecure placeholder detected for JWT_ACCESS_SECRET in production! " +
      "Generate a secure 64-character secret using: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  if (isPlaceholderSecret(parsed.JWT_REFRESH_SECRET)) {
    throw new Error(
      "FATAL SECURITY CONFIGURATION: Insecure placeholder detected for JWT_REFRESH_SECRET in production! " +
      "Generate a secure 64-character secret using: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
} else if (isPlaceholderSecret(parsed.JWT_ACCESS_SECRET) || isPlaceholderSecret(parsed.JWT_REFRESH_SECRET)) {
  console.warn(
    "[Security Warning] You are using default or placeholder JWT secrets. " +
    "Be sure to set strong 64-char random secrets in .env before deploying to production."
  );
}

export const env = parsed;
