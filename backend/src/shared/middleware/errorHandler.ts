import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

/**
 * Middleware to handle errors in the application.
 * It captures operational errors and sends a structured response.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errorDetails: string | string[] = [];

  // Zod validation error
  if (err instanceof ZodError) {
    statusCode = 422;
    message = "Validation failed";
    errorDetails = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
  }

  // AppError personalizado
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // JSON malformado
  else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON format in request body";
  }

  // Body demasiado grande
  else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
  }

  // Otros errores inesperados
  else if (err instanceof Error) {
    message = err.message;
  }

  // Logging básico (puedes reemplazar con winston/pino si quieres)
  console.error("❌ Error capturado:", {
    path: req.path,
    method: req.method,
    statusCode,
    message,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(errorDetails.length ? { errors: errorDetails } : {}),
  });
};
