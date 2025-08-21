import { AuthRequest } from "@/modules/auth/auth.types";
import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "@/shared/utils/AppError";
import { logger } from "@/shared/utils/logger";

export const errorHandler = (
  error: any,
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errorDetails: string[] = [];
  let action = "UNHANDLED_ERROR";

  // Zod validation error
  if (error instanceof ZodError) {
    statusCode = 422;
    message = "Validation failed";
    errorDetails = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    action = "VALIDATION_ERROR";
  }

  // Custom AppError
  else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    action = "APP_ERROR";
  }

  // Wrong JSON format
  else if (error?.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON format in request body";
    action = "BAD_JSON";
  }

  // Big Body
  else if (error?.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
    action = "BODY_TOO_LARGE";
  }

  // Unexpected errors
  else if (error instanceof Error) {
    message = error.message;
  }

  // Unified error logging
  logger.error({
    name: error.name || "UnknownError",
    message: error.message || message,
    statusCode,
    stack: error.stack,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    action,
    ...(error instanceof AppError && error.meta && { meta: error.meta }),
    ...(error instanceof AppError && error.cause && { cause: error.cause.message }),
  });

  const metaErrors =
    error instanceof AppError && Array.isArray(error.meta?.errors)
      ? error.meta.errors
      : [];

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(errorDetails.length ? { errors: errorDetails } : {}),
    ...(metaErrors.length ? { errors: metaErrors } : {}),
  });
};