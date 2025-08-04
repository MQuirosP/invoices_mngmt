import { NextFunction, Response } from "express";
import { AppError } from "@/shared/utils/AppError.utils";
import { AuthRequest } from "../../modules/auth/auth.types";

/**
 * Middleware para verificar que el usuario tenga el rol adecuado
 * @param allowedRoles Lista de roles válidos para la ruta (ej. ["ADMIN", "MANAGER"])
 */
export const requireRole = (allowedRoles: readonly string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const { user } = req;

    if (!user?.role) {
      throw new AppError("User role not found", 401);
    }

    if (!allowedRoles.includes(user.role)) {
      throw new AppError("Access denied: insufficient permissions", 403);
    }

    next();
  };
};
