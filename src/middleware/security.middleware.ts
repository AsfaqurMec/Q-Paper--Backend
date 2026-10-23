import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Express, NextFunction, Request, Response } from "express";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "../config/env.js";
import { ApiError } from "../utils/http.js";
import { deepSanitize } from "../utils/security.js";

/**
 * Dedicated strict rate limiter for authentication routes:
 * Throttles credential stuffing, brute-forcing, and account enumeration.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // 20 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts from this IP address. Please try again in 15 minutes."
  }
});

/**
 * Dedicated rate limiter for password-protected shared link verification:
 * Prevents automated brute-forcing of paper passwords.
 */
export const publicShareRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30, // 30 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password verification attempts for this shared paper. Please try again later."
  }
});

/**
 * Cross-Site Request Forgery (CSRF) protection:
 * Validates origin / referer on state-changing requests (POST, PUT, PATCH, DELETE).
 */
export function validateCsrfOrigin(req: Request, _res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
  if (!origin) {
    // In local dev, automated server-side calls, or curl without origin header, allow through
    return next();
  }

  try {
    const originHost = new URL(origin).host;
    const clientHost = new URL(env.CLIENT_URL).host;

    const isAllowed =
      originHost === clientHost ||
      (env.NODE_ENV !== "production" &&
        (originHost.startsWith("localhost:") || originHost.startsWith("127.0.0.1:")));

    if (!isAllowed) {
      return next(new ApiError(403, "Cross-Origin Request Blocked: CSRF validation failed"));
    }
  } catch {
    return next(new ApiError(403, "Malformed Origin or Referer header"));
  }

  next();
}

/**
 * Global input sanitization middleware:
 * Cleans all incoming request bodies against HTML/SVG injection before reaching routes.
 */
export function inputSanitizer(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    req.body = deepSanitize(req.body);
  }
  next();
}

/**
 * Applies primary defense-in-depth security middleware.
 */
export function applySecurity(app: Express) {
  // 1. Helmet HTTP Security Headers (X-Content-Type-Options, Frameguard, etc.)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      xContentTypeOptions: true,
      xFrameOptions: { action: "sameorigin" }
    })
  );

  // 2. Strict CORS policy
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      exposedHeaders: ["Content-Disposition"]
    })
  );

  // 3. CSRF origin validation for mutation requests
  app.use(validateCsrfOrigin);

  // 4. Compression & Cookie Parser
  app.use(compression());
  app.use(cookieParser());

  // 5. NoSQL Injection protection: Strips `$` and `.` characters from req.body, req.query, and req.params
  app.use(
    mongoSanitize({
      replaceWith: "_"
    })
  );

  // 6. Deep input XSS sanitization across all request bodies
  app.use(inputSanitizer);

  // 7. Global API Rate Limiter
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  // 8. Access logging
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
}
