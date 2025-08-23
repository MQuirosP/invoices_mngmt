import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "@/shared/utils/appError.utils";
import { Role } from "@prisma/client";
import { logger } from "@/shared";
import { AuthRequest } from "./auth.types";
import { redis } from "../../lib/redis";

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  logger.info({
    layer: "middleware",
    action: "AUTH_CHECK_INIT",
    method: req.method,
    path: req.originalUrl,
    hasAuthHeader: !!authHeader,
  });

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn({
      layer: "middleware",
      action: "AUTH_HEADER_INVALID",
      method: req.method,
      path: req.originalUrl,
      authHeader,
    });

    return next(
      new AppError(
        "Authentication token is missing or invalid",
        401,
        true,
        undefined,
        {
          context: "AUTH_MIDDLEWARE",
          path: req.originalUrl,
          method: req.method,
          authHeader,
        }
      )
    );
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logger.error({
      layer: "middleware",
      action: "JWT_SECRET_MISSING",
      method: req.method,
      path: req.originalUrl,
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
    const decoded = jwt.verify(token, secret, { clockTolerance: 5 }) as {
      sub: string;
      email: string;
      role: Role;
      jti?: string;
    };

    logger.info({
      layer: "middleware",
      action: "JWT_VERIFIED",
      method: req.method,
      path: req.originalUrl,
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      jti: decoded.jti,
    });

    if (decoded.jti) {
      const isRevoked = await redis.get(`revoked:${decoded.jti}`);

      if (isRevoked !== null) {
        logger.warn({
          layer: "middleware",
          action: "JWT_REVOKED",
          method: req.method,
          path: req.originalUrl,
          userId: decoded.sub,
          jti: decoded.jti,
        });

        return next(
          new AppError("Token has been revoked", 401, true, undefined, {
            context: "AUTH_MIDDLEWARE",
            path: req.originalUrl,
            method: req.method,
            jti: decoded.jti,
          })
        );
      }
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      jti: decoded.jti || "",
    };

    logger.info({
      layer: "middleware",
      action: "AUTH_SUCCESS",
      method: req.method,
      path: req.originalUrl,
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    });

    next();
  } catch (error) {
    logger.error({
      layer: "middleware",
      action: "JWT_VERIFICATION_ERROR",
      method: req.method,
      path: req.originalUrl,
      token,
      error: error instanceof Error ? error.message : String(error),
    });

    return next(
      new AppError(
        "Invalid or expired token",
        401,
        true,
        error instanceof Error ? error : undefined,
        {
          context: "AUTH_MIDDLEWARE",
          path: req.originalUrl,
          method: req.method,
          token,
        }
      )
    );
  }
};

export { AuthRequest };