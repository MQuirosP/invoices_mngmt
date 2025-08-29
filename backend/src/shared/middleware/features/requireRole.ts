import { NextFunction, Response } from "express";
import { AppError } from "@/shared/utils/appError.utils";
import { logger } from "@/shared/utils/logging/logger";
import { AuthRequest } from "@/modules/auth";
import { getInvoiceById } from "../../../modules/invoice";

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

export const requireRoleOrOwner = (allowedRoles: readonly string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { user } = req;

    if (!user?.id) {
      throw new AppError("Missing user ID", 401);
    }

    // Si el rol está permitido, pasa directo
    if (allowedRoles.includes(user.role)) {
      return next();
    }

    const invoiceId = req.params.id;
    const invoice = await getInvoiceById(invoiceId, user.id); // ✅ user.id ya está validado

    if (invoice?.userId === user.id) {
      return next(); // ✅ es dueño, se permite
    }

    logger.warn({
      layer: "middleware",
      action: "ROLE_OR_OWNERSHIP_UNAUTHORIZED",
      userId: user.id,
      actualRole: user.role,
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
        userId: user.id,
        actualRole: user.role,
        requiredRoles: allowedRoles,
        path: req.originalUrl,
        method: req.method,
      }
    );
  };
};