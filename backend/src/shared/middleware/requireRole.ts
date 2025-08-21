import { NextFunction, Response } from "express";
import { AppError } from "@/shared/utils/AppError";
import { AuthRequest } from "../../modules/auth/auth.types";
import { logger } from "@/shared/utils/logger";

/**
 * Middleware para verificar que el usuario tenga el rol adecuado
 * @param allowedRoles Lista de roles válidos para la ruta (ej. ["ADMIN", "MANAGER"])
 */
export const requireRole = (allowedRoles: readonly string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const { user } = req;

    if (!user?.role || !allowedRoles.includes(user.role)) {
      logger.warn({
        action: "ROLE_UNAUTHORIZED",
        context: "AUTH_MIDDLEWARE",
        userId: user?.id,
        actualRole: user?.role,
        requiredRoles: allowedRoles,
        path: req.originalUrl,
        method: req.method,
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