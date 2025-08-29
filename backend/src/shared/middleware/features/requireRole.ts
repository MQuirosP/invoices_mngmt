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

    // Si el rol está permitido, pasa directo
    if (user?.role && allowedRoles.includes(user.role)) {
      return next();
    }

    // Si no tiene rol permitido, verificar si es dueño del recurso
    const invoiceId = req.params.id;
    if (!user?.id) {
      throw new AppError("Missing user ID", 401);
    }

    const invoice = await getInvoiceById(invoiceId, user?.id); // 👈 validás ownership

    if (invoice?.userId === user?.id) {
      return next(); // 👈 es dueño, se permite
    }

    // Si no es dueño ni tiene rol, se rechaza
    logger.warn({
      layer: "middleware",
      action: "ROLE_OR_OWNERSHIP_UNAUTHORIZED",
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
  };
};
