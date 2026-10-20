import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new ApiError(422, "Validation failed", result.error.flatten()));
    }
    req[source] = result.data;
    next();
  };
}

export function ok(res: Response, data: unknown, message = "OK", status = 200) {
  return res.status(status).json({ success: true, message, data });
}
