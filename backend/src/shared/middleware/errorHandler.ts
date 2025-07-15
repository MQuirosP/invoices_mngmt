import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "@/shared/utils/AppError.utils";
import { logError } from "@/shared/utils/logger";

/**
 * Middleware to handle errors in the application.
 * It captures operational errors and sends a structured response.
 */
export const errorHandler = (
  error: any,
  req: Request,
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
  logError(error, `${req.method} ${req.path} [${statusCode}]`);
  // console.error("❌ Error capturado:", {
  //   path: req.path,
  //   method: req.method,
  //   statusCode,
  //   message,
  //   stack: error.stack,
  // });

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(errorDetails.length ? { errors: errorDetails } : {}),
  });
};
