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

    // Validación defensiva: ruta mal configurada
    if (!allowedRoles.length) {
      logger.error({
        action: "ROLE_CONFIG_MISSING",
        context: "AUTH_MIDDLEWARE",
        path: req.originalUrl,
        method: req.method,
      });

      throw new AppError(
        "No roles configured for this route",
        500,
        true,
        undefined,
        {
          path: req.originalUrl,
          method: req.method,
        }
      );
    }

    // Usuario sin rol
    if (!user?.role) {
      logger.warn({
        action: "ROLE_MISSING",
        context: "AUTH_MIDDLEWARE",
        userId: user?.id,
        path: req.originalUrl,
        method: req.method,
      });

      throw new AppError(
        "User role not found",
        401,
        true,
        undefined,
        {
          userId: user?.id,
          path: req.originalUrl,
          method: req.method,
        }
      );
    }

    // Rol no autorizado
    if (!allowedRoles.includes(user.role)) {
      logger.warn({
        action: "ROLE_UNAUTHORIZED",
        context: "AUTH_MIDDLEWARE",
        userId: user.id,
        actualRole: user.role,
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
          userId: user.id,
          actualRole: user.role,
          requiredRoles: allowedRoles,
          path: req.originalUrl,
          method: req.method,
        }
      );
    }

    next();
  };
};