import { NextFunction, Response } from "express";
import { AppError } from "@/shared/utils/appError.utils";
import { AuthRequest } from "../../modules/auth/auth.types";
import { logger } from "@/shared/utils/logging/logger";

/**
 * Middleware para verificar que el usuario tenga el rol adecuado
 * @param allowedRoles Lista de roles válidos para la ruta (ej. ["ADMIN", "MANAGER"])
 */
export const requireRole = (allowedRoles: readonly string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const { user } = req;

    if (!user?.role || !allowedRoles.includes(user.role)) {
      logger.warn({
        layer: "middleware",
        action: "ROLE_UNAUTHORIZED",
        userId: user?.id,
        actualRole: user?.role,
        requiredRoles: allowedRoles,
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
      });

      throw new AppError(
        "Access denied: insufficient permissions",
        403,
        true,
        undefined,
        {
          userId: user?.id,
          actualRole: user?.role,
          requiredRoles: allowedRoles,
          path: req.originalUrl,
          method: req.method,
        }
      );
    }

    next();
  };
};