import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/http.js";

import { env } from "../config/env.js";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const isCustomApiError = err instanceof ApiError;
  const status = isCustomApiError ? err.statusCode : 500;
  const details = isCustomApiError ? err.details : undefined;

  // In production, mask internal 500 errors to avoid leaking database/system stack traces
  let message = err.message || "Internal server error";
  if (!isCustomApiError && env.NODE_ENV === "production" && status >= 500) {
    message = "An unexpected internal server error occurred. Please try again later.";
    console.error("[InternalServerError]", err);
  }

  res.status(status).json({
    success: false,
    message,
    details
  });
}
