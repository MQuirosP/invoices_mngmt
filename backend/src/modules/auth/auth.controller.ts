import { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import { registerUser, loginUser } from "./auth.service";
import { AppError } from "@/shared/utils/AppError.utils";
import { logger } from "@/shared/utils/logger";

// Create user
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = registerSchema.parse(req.body);
    const result = await registerUser(parsed);

    logger.info({
      action: "USER_REGISTERED",
      context: "AUTH_CONTROLLER",
      userId: result.id,
      method: req.method,
      path: req.originalUrl,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: "User registered successfully",
    });
  } catch (error) {
    next(
      new AppError("Registration failed", 400, true, error instanceof Error ? error : undefined, {
        context: "AUTH_CONTROLLER",
        route: req.originalUrl,
        method: req.method,
        payload: req.body,
      })
    );
  }
};

// Login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = await loginUser(parsed);

    logger.info({
      action: "USER_LOGGED_IN",
      context: "AUTH_CONTROLLER",
      userId: result.id,
      method: req.method,
      path: req.originalUrl,
    });

    res.status(200).json({
      success: true,
      data: result,
      message: "User logged in successfully",
    });
  } catch (error) {
    next(
      new AppError("Login failed", 401, true, error instanceof Error ? error : undefined, {
        context: "AUTH_CONTROLLER",
        route: req.originalUrl,
        method: req.method,
        payload: req.body,
      })
    );
  }
};