import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "@/shared/utils/AppError.utils";
import { Role } from "@prisma/client";

export interface AuthRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  user?: {
    id: string;
    email: string;
    role: Role
  };
}


export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication token is missing or invalid", 401);
    }
    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new AppError("JWT secret is not defined", 500);
    }
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
    next(new AppError("Authentication failed", 401));
  }
};
