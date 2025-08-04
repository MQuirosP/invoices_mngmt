import { AuthRequest } from '@/modules/auth/auth.types';
import { Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "@/shared/utils/AppError.utils";
import { logger } from "@/shared/utils/logger";

/**
 * Middleware to handle errors in the application.
 * It captures operational errors and sends a structured response.
 */
export const errorHandler = (
  error: any,
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {

  let statusCode = 500;
  let message = "Internal Server Error";
  let errorDetails: string | string[] = [];

  // Zod validation error
  if (error instanceof ZodError) {
    statusCode = 422;
    message = "Validation failed";
    errorDetails = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
  }

  // Custom AppError
  else if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Wrong JSON format
  else if (error.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON format in request body";
  }

  // Big Body
  else if (error.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
  }

  // Unexpected errors
  else if (error instanceof Error) {
    message = error.message;
  }

  // Logging básico (puedes reemplazar con winston/pino si quieres)
  // logError(error, `${req.method} ${req.path} [${statusCode}]`);
  logger.error({
  name: error.name,
  message,
  statusCode,
  stack: error.stack,
  path: req.originalUrl,
  method: req.method,
  userId: req.user?.id,
  action: "UNHANDLED_ERROR",
});

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(errorDetails.length ? { errors: errorDetails } : {}),
  });
};
