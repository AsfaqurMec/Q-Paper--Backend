import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";

import type { PlanCode } from "../modules/shared/types.js";

export type AuthUser = {
  id: string;
  role: "user" | "admin";
  plan: PlanCode;
  name?: string;
  email?: string;
  sessionId?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

import { AuthSessionModel } from "../modules/auth/auth.models.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.accessToken;

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser;

    // Real-time session check: instantly rejects logged-out or invalidated tokens
    if (payload.sessionId) {
      const sessionActive = await AuthSessionModel.exists({ sessionId: payload.sessionId });
      if (!sessionActive) {
        return next(new ApiError(401, "Session has been revoked or logged out"));
      }
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(new ApiError(401, "Invalid or expired access token"));
  }
}

export function requireRole(...roles: AuthUser["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }
    next();
  };
}
