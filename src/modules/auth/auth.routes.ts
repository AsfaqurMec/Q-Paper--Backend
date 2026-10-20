import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { authRateLimiter } from "../../middleware/security.middleware.js";
import { asyncHandler, ok, validate } from "../../utils/http.js";
import { changePasswordSchema, forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, updateProfileSchema } from "./auth.schemas.js";
import { changePassword, forgotPassword, getUserById, login, logout, refresh, register, resetPassword, updateProfile, verifyEmail } from "./auth.service.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await register(req.body, req);
    res.cookie("refreshToken", result.refreshToken, { httpOnly: true, sameSite: "lax", secure: req.secure });
    return ok(res, result, "Account created", 201);
  })
);

authRouter.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await login(req.body, req);
    res.cookie("refreshToken", result.refreshToken, { httpOnly: true, sameSite: "lax", secure: req.secure });
    return ok(res, result, "Logged in");
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const result = await refresh(req.cookies?.refreshToken ?? req.body.refreshToken);
    res.cookie("refreshToken", result.refreshToken, { httpOnly: true, sameSite: "lax", secure: req.secure });
    return ok(res, result, "Token refreshed");
  })
);

authRouter.post("/logout", requireAuth, asyncHandler(async (req, res) => {
  await logout(req.user?.sessionId);
  res.clearCookie("refreshToken");
  return ok(res, null, "Logged out");
}));

authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => ok(res, await getUserById(req.user!.id))));

authRouter.get("/profile", requireAuth, asyncHandler(async (req, res) => ok(res, await getUserById(req.user!.id))));

authRouter.put(
  "/profile",
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler(async (req, res) => ok(res, await updateProfile(req.user!.id, req.body), "Profile updated successfully"))
);

authRouter.post(
  "/change-password",
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(async (req, res) => ok(res, await changePassword(req.user!.id, req.body), "Password changed"))
);

authRouter.post(
  "/forgot-password",
  authRateLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => ok(res, await forgotPassword(req.body.email), "If the account exists, reset instructions were sent"))
);

authRouter.post(
  "/reset-password",
  authRateLimiter,
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => ok(res, await resetPassword(req.body), "Password reset"))
);

authRouter.post(
  "/verify-email",
  requireAuth,
  asyncHandler(async (req, res) => ok(res, await verifyEmail(req.user!.id), "Email verified"))
);
