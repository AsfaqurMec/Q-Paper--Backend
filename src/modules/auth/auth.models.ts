import mongoose, { Schema, type Model } from "mongoose";
import type { PlanCode } from "../shared/types.js";

export type AuthUserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  plan: PlanCode;
  verified: boolean;
  phone?: string;
  institute?: string;
  failedLoginAttempts?: number;
  lockUntil?: number;
  createdAt: string;
  updatedAt: string;
};

export type AuthSessionRecord = {
  sessionId: string;
  userId: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: string;
};

export type PasswordResetTokenRecord = {
  token: string;
  userId: string;
  expiresAt: number;
  createdAt: string;
};

const userSchema = new Schema<AuthUserRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], required: true, default: "user" },
    plan: { type: String, required: true, default: "free" },
    verified: { type: Boolean, default: false },
    phone: { type: String },
    institute: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Number, default: 0 },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true }
  },
  { versionKey: false }
);

const sessionSchema = new Schema<AuthSessionRecord>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Number, required: true, index: true },
    createdAt: { type: String, required: true }
  },
  { versionKey: false }
);

const passwordResetTokenSchema = new Schema<PasswordResetTokenRecord>(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Number, required: true, index: true },
    createdAt: { type: String, required: true }
  },
  { versionKey: false }
);

export const UserModel =
  (mongoose.models.AuthUser as Model<AuthUserRecord> | undefined) ??
  mongoose.model<AuthUserRecord>("AuthUser", userSchema, "users");

export const AuthSessionModel =
  (mongoose.models.AuthSession as Model<AuthSessionRecord> | undefined) ??
  mongoose.model<AuthSessionRecord>("AuthSession", sessionSchema, "auth_sessions");

export const PasswordResetTokenModel =
  (mongoose.models.PasswordResetToken as Model<PasswordResetTokenRecord> | undefined) ??
  mongoose.model<PasswordResetTokenRecord>("PasswordResetToken", passwordResetTokenSchema, "password_reset_tokens");
