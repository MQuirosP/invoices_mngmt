import { Request, Response, NextFunction } from "express";
import { AppError } from "@/shared/utils/appError.utils";
import { logger } from "@/shared/utils/logging/logger";

/**
 * Middleware para validar que ciertos parámetros estén presentes en req.params
 * @param params Lista de nombres de parámetros requeridos
 */
export const validateParams = (params: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const missing = params.filter((p) => !req.params[p]);

    if (missing.length > 0) {
      logger.warn({
        layer: "middleware",
        action: "PARAMS_VALIDATION_FAILED",
        path: req.originalUrl,
        method: req.method,
        missingParams: missing,
        timestamp: new Date().toISOString(),
      });

      throw new AppError(
        `Missing required parameters: ${missing.join(", ")}`,
        400,
        true,
        undefined,
        {
          path: req.originalUrl,
          method: req.method,
          missingParams: missing,
        }
      );
    }

    next();
  };
};