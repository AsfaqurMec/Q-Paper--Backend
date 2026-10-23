import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol");

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: passwordSchema
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16),
  newPassword: passwordSchema
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional()
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(30).optional(),
  institute: z.string().max(160).optional(),
  instituteLogo: z.string().max(2000).optional(),
  instituteBranding: z.boolean().optional()
});
