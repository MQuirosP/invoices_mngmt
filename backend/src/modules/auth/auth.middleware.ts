import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "@/shared/utils/AppError.utils";
import { Role } from "@prisma/client";
import { logger } from "@/shared";
import { AuthRequest } from "./auth.types";

// export interface AuthRequest extends Request {
//   files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
//   user?: {
//     id: string;
//     email: string;
//     role: Role;
//   };
// }

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    logger.warn({
      message: "Missing or malformed Authorization header",
      context: "AUTH_MIDDLEWARE",
    });
    return next(new AppError("Authentication token is missing or invalid", 401));
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logger.error({
      message: "JWT_SECRET is not defined",
      context: "AUTH_MIDDLEWARE",
    });
    return next(new AppError("JWT secret is not defined", 500));
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

    next();
  } catch (error) {
    logger.warn({
      message: "JWT verification failed",
      token,
      error: error instanceof Error ? error.message : String(error),
      context: "AUTH_MIDDLEWARE",
    });

    return next(new AppError("Invalid or expired token", 401));
  }
};

export { AuthRequest };
