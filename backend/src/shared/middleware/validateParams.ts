import { Request, Response, NextFunction } from "express";
import { AppError } from "@/shared/utils/AppError";
import { logger } from "@/shared/utils/logger";

/**
 * Middleware para validar que ciertos parámetros estén presentes en req.params
 * @param params Lista de nombres de parámetros requeridos
 */
export const validateParams = (params: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const missing = params.filter((p) => !req.params[p]);

    if (missing.length > 0) {
      logger.warn({
        action: "PARAMS_VALIDATION_FAILED",
        context: "PARAMS_MIDDLEWARE",
        path: req.originalUrl,
        method: req.method,
        missingParams: missing,
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