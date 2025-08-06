import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "@/shared/utils/AppError.utils";
import { Role } from "@prisma/client";
import { logger } from "@/shared";
import { AuthRequest } from "./auth.types";

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn({
      action: "AUTH_HEADER_MISSING",
      message: "Missing or malformed Authorization header",
      context: "AUTH_MIDDLEWARE",
      path: req.originalUrl,
      method: req.method,
    });

    return next(
      new AppError("Authentication token is missing or invalid", 401, true, undefined, {
        context: "AUTH_MIDDLEWARE",
        path: req.originalUrl,
        method: req.method,
        authHeader,
      })
    );
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logger.error({
      action: "JWT_SECRET_MISSING",
      message: "JWT_SECRET is not defined",
      context: "AUTH_MIDDLEWARE",
      path: req.originalUrl,
      method: req.method,
    });

    return next(
      new AppError("JWT secret is not defined", 500, true, undefined, {
        context: "AUTH_MIDDLEWARE",
        path: req.originalUrl,
        method: req.method,
      })
    );
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      sub: string;
      email: string;
      role: Role;
    };

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    logger.info({
      action: "AUTH_SUCCESS",
      context: "AUTH_MIDDLEWARE",
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      path: req.originalUrl,
      method: req.method,
    });

    next();
  } catch (error) {
    logger.warn({
      action: "JWT_VERIFICATION_FAILED",
      message: "JWT verification failed",
      token,
      error: error instanceof Error ? error.message : String(error),
      context: "AUTH_MIDDLEWARE",
      path: req.originalUrl,
      method: req.method,
    });

    return next(
      new AppError("Invalid or expired token", 401, true, error instanceof Error ? error : undefined, {
        context: "AUTH_MIDDLEWARE",
        path: req.originalUrl,
        method: req.method,
        token,
      })
    );
  }
};

export { AuthRequest };