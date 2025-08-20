import { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import { registerUser, loginUser, getUsers } from "./auth.service";
import { AppError } from "@/shared/utils/AppError";
import { logger } from "@/shared/utils/logger";
import { AuthRequest } from "./auth.types";
import { revokeToken } from "../../shared/utils/token/revokeToken";

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
      new AppError(
        "Registration failed",
        400,
        true,
        error instanceof Error ? error : undefined,
        {
          context: "AUTH_CONTROLLER",
          route: req.originalUrl,
          method: req.method,
          payload: req.body,
        }
      )
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
      new AppError(
        "Login failed",
        401,
        true,
        error instanceof Error ? error : undefined,
        {
          context: "AUTH_CONTROLLER",
          route: req.originalUrl,
          method: req.method,
          payload: req.body,
        }
      )
    );
  }
};

export const listUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  logger.info({
    action: "USERS_LIST_REQUEST",
    context: "AUTH_CONTROLLER",
    userId: req.user?.id,
    method: req.method,
  });
  try {
    const users = await getUsers();
    logger.info({
      action: "USERS_LIST_SUCCESS",
      context: "AUTH_CONTROLLER",
      method: req.method,
      path: req.originalUrl,
      userId: req.user?.id,
      count: users.length,
    });

    res.status(200).json({
      success: true,
      data: users,
      message: "Users retrieved successfully",
    });
  } catch (error) {
    logger.error({
      action: "USERS_LIST_ERROR",
      context: "AUTH_CONTROLLER",
      method: req.method,
      path: req.originalUrl,
      userId: req.user?.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    next(
      new AppError(
        "Failed to list users",
        500,
        true,
        error instanceof Error ? error : undefined,
        {
          context: "AUTH_CONTROLLER",
          route: req.originalUrl,
          method: req.method,
          userId: req.user?.id,
        }
      )
    );
  }
};

export const logoutUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const jti = req.user?.jti;
  const userId = req.user?.id;

  logger.info({
    action: "USER_LOGOUT_ATTEMPT",
    context: "AUTH_CONTROLLER",
    userId,
    method: req.method,
    path: req.originalUrl,
    jti,
  });

  if (!jti) {
    logger.warn({
      action: "LOGOUT_JTI_MISSING",
      context: "AUTH_CONTROLLER",
      userId,
      method: req.method,
      path: req.originalUrl,
    });

    res.status(400).json({
      success: false,
      message: "Missing token identifier (jti)",
    });
    return;
  }

  try {
    await revokeToken(jti);

    logger.info({
      action: "USER_LOGOUT_SUCCESS",
      context: "AUTH_CONTROLLER",
      userId,
      method: req.method,
      path: req.originalUrl,
      jti,
    });

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    logger.error({
      action: "USER_LOGOUT_ERROR",
      context: "AUTH_CONTROLLER",
      userId,
      method: req.method,
      path: req.originalUrl,
      jti,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    next(
      new AppError(
        "Logout failed",
        500,
        true,
        error instanceof Error ? error : undefined,
        {
          context: "AUTH_CONTROLLER",
          route: req.originalUrl,
          method: req.method,
          userId,
          jti,
        }
      )
    );
  }
};

