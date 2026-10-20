import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { env } from "../../config/env.js";
import type { AuthUser } from "../../middleware/auth.middleware.js";
import { ApiError } from "../../utils/http.js";
import type { Request } from "express";
import { AuthSessionModel, PasswordResetTokenModel, UserModel, type AuthUserRecord } from "./auth.models.js";
import { resolveDevice } from "../device/device.service.js";

const refreshTokenTtlMs = 1000 * 60 * 60 * 24 * 30;
const now = () => new Date().toISOString();

function ensureDatabase() {
  if (!env.MONGODB_URI || mongoose.connection.readyState === 0) {
    throw new ApiError(503, "Authentication requires a MongoDB connection");
  }
}

function isDuplicateKeyError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

async function signTokens(user: AuthUserRecord) {
  const sessionId = nanoid(24);
  const payload: AuthUser = { id: user.id, role: user.role, plan: user.plan, sessionId };
  const accessOptions: SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"] };
  const refreshOptions: SignOptions = { expiresIn: env.REFRESH_TOKEN_TTL as SignOptions["expiresIn"] };
  const tokens = {
    accessToken: jwt.sign(payload, env.JWT_ACCESS_SECRET, accessOptions),
    refreshToken: jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshOptions)
  };

  await AuthSessionModel.create({
    sessionId,
    userId: user.id,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + refreshTokenTtlMs,
    createdAt: now()
  });

  return tokens;
}

export async function register(input: { name: string; email: string; password: string }, req?: Request) {
  ensureDatabase();

  const timestamp = now();
  try {
    const user = await UserModel.create({
      id: `usr_${nanoid(16)}`,
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: "user",
      plan: "free",
      verified: false,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    if (req) {
      await resolveDevice(req, user.id).catch((err) => console.warn("[Device] Registration sync error:", err));
    }

    const tokens = await signTokens(user);
    return { user: publicUser(user), ...tokens };
  } catch (error) {
    if (isDuplicateKeyError(error)) throw new ApiError(409, "Email is already registered");
    throw error;
  }
}

export async function login(input: { email: string; password: string }, req?: Request) {
  ensureDatabase();

  const user = await UserModel.findOne({ email: input.email });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // 1. Account Lockout check (5 failed attempts -> 15 min lock)
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
    throw new ApiError(
      429,
      `This account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesLeft} minute(s) or reset your password.`
    );
  }

  // 2. Validate password
  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    if (attempts >= 5) {
      user.failedLoginAttempts = 0;
      user.lockUntil = Date.now() + 15 * 60 * 1000;
      await user.save();
      throw new ApiError(
        429,
        "Too many failed login attempts. Your account has been temporarily locked for 15 minutes for your security."
      );
    } else {
      user.failedLoginAttempts = attempts;
      await user.save();
      const remaining = 5 - attempts;
      throw new ApiError(
        401,
        `Invalid email or password. (${remaining} attempt${remaining === 1 ? "" : "s"} remaining before temporary lockout)`
      );
    }
  }

  // 3. Reset failed counters on successful login
  if ((user.failedLoginAttempts || 0) > 0 || (user.lockUntil || 0) > 0) {
    user.failedLoginAttempts = 0;
    user.lockUntil = 0;
    await user.save();
  }

  if (req) {
    await resolveDevice(req, user.id).catch((err) => console.warn("[Device] Login sync error:", err));
  }

  const tokens = await signTokens(user);
  return { user: publicUser(user), ...tokens };
}

export async function refresh(refreshToken: string | undefined) {
  ensureDatabase();
  if (!refreshToken) throw new ApiError(401, "Refresh token required");

  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthUser;
    const session = payload.sessionId ? await AuthSessionModel.findOne({ sessionId: payload.sessionId }).lean() : undefined;
    if (!session || session.refreshToken !== refreshToken || session.expiresAt < Date.now()) {
      throw new ApiError(401, "Refresh session is invalid");
    }

    const user = await UserModel.findOne({ id: payload.id }).lean();
    if (!user) throw new ApiError(401, "User no longer exists");

    await AuthSessionModel.deleteOne({ sessionId: payload.sessionId });
    const tokens = await signTokens(user);
    return { user: publicUser(user), ...tokens };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Invalid refresh token");
  }
}

export async function logout(sessionId?: string) {
  ensureDatabase();
  if (sessionId) await AuthSessionModel.deleteOne({ sessionId });
}

export async function changePassword(userId: string, input: { currentPassword: string; newPassword: string }) {
  ensureDatabase();

  const user = await UserModel.findOne({ id: userId });
  if (!user) throw new ApiError(404, "User not found");

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) throw new ApiError(401, "Current password is incorrect");

  user.passwordHash = await bcrypt.hash(input.newPassword, 12);
  user.updatedAt = now();
  await user.save();
  await AuthSessionModel.deleteMany({ userId: user.id });

  return publicUser(user);
}

export async function forgotPassword(email: string) {
  ensureDatabase();

  const user = await UserModel.findOne({ email }).lean();
  if (!user) return { sent: true };

  const token = nanoid(48);
  await PasswordResetTokenModel.create({
    token,
    userId: user.id,
    expiresAt: Date.now() + 1000 * 60 * 15,
    createdAt: now()
  });

  if (env.NODE_ENV !== "production") {
    console.log(`[Dev-Auth] Password reset token for ${email}: ${token}`);
  }

  return { sent: true };
}

export async function resetPassword(input: { token: string; newPassword: string }) {
  ensureDatabase();

  const record = await PasswordResetTokenModel.findOne({ token: input.token });
  if (!record || record.expiresAt < Date.now()) throw new ApiError(400, "Reset token is invalid or expired");

  const user = await UserModel.findOne({ id: record.userId });
  if (!user) throw new ApiError(404, "User not found");

  user.passwordHash = await bcrypt.hash(input.newPassword, 12);
  user.updatedAt = now();
  await user.save();
  await PasswordResetTokenModel.deleteOne({ token: input.token });
  await AuthSessionModel.deleteMany({ userId: user.id });

  return publicUser(user);
}

export async function verifyEmail(userId: string) {
  ensureDatabase();

  const user = await UserModel.findOneAndUpdate({ id: userId }, { verified: true, updatedAt: now() }, { new: true }).lean();
  if (!user) throw new ApiError(404, "User not found");

  return publicUser(user);
}

export async function getUserById(userId: string) {
  ensureDatabase();
  const user = await UserModel.findOne({ id: userId }).lean();
  if (!user) throw new ApiError(404, "User not found");
  return publicUser(user);
}

export async function updateProfile(
  userId: string,
  input: { name?: string; phone?: string; institute?: string }
) {
  ensureDatabase();

  const updateData: Record<string, any> = { updatedAt: now() };
  if (input.name && input.name.trim()) updateData.name = input.name.trim();
  if (input.phone !== undefined) updateData.phone = input.phone.trim();
  if (input.institute !== undefined) updateData.institute = input.institute.trim();

  const user = await UserModel.findOneAndUpdate(
    { id: userId },
    { $set: updateData },
    { new: true }
  ).lean();
  if (!user) throw new ApiError(404, "User not found");

  return publicUser(user);
}

export function publicUser(user: Partial<AuthUserRecord> & { id: string; name: string; email: string; role: "user" | "admin"; plan: any }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.plan,
    verified: Boolean(user.verified),
    phone: user.phone || "",
    institute: user.institute || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}
