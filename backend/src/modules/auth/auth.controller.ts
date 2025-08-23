import { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import { AppError } from "@/shared/utils/appError.utils";
import { logger } from "@/shared/utils/logging/logger";
import { AuthRequest } from "./auth.types";
import { revokeToken } from "@/shared/utils/token/revokeToken";
import { AuthService } from "./auth.service";

export class AuthController {
  private readonly service: AuthService;

  constructor(service?: AuthService) {
    this.service = service ?? new AuthService();
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    logger.info({
      layer: "controller",
      action: "USER_REGISTER_ATTEMPT",
      method: req.method,
      path: req.originalUrl,
      payload: req.body,
    });

    try {
      const parsed = registerSchema.parse(req.body);
      const result = await this.service.registerUser(parsed);

      logger.info({
        layer: "controller",
        action: "USER_REGISTER_SUCCESS",
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
      logger.error({
        layer: "controller",
        action: "USER_REGISTER_ERROR",
        method: req.method,
        path: req.originalUrl,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      next(
        error instanceof AppError
          ? error
          : new AppError("Registration failed", 500, true, error instanceof Error ? error : undefined, {
              context: "AUTH_CONTROLLER",
              route: req.originalUrl,
              method: req.method,
              payload: req.body,
            })
      );
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    logger.info({
      layer: "controller",
      action: "USER_LOGIN_ATTEMPT",
      method: req.method,
      path: req.originalUrl,
      payload: req.body,
    });

    try {
      const parsed = loginSchema.parse(req.body);
      const result = await this.service.loginUser(parsed);

      logger.info({
        layer: "controller",
        action: "USER_LOGIN_SUCCESS",
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
      logger.error({
        layer: "controller",
        action: "USER_LOGIN_ERROR",
        method: req.method,
        path: req.originalUrl,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      next(
        error instanceof AppError
          ? error
          : new AppError("Login failed", 500, true, error instanceof Error ? error : undefined, {
              context: "AUTH_CONTROLLER",
              route: req.originalUrl,
              method: req.method,
              payload: req.body,
            })
      );
    }
  }

  async listUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const userId = req.user?.id;

    logger.info({
      layer: "controller",
      action: "USER_LIST_ATTEMPT",
      userId,
      method: req.method,
      path: req.originalUrl,
    });

    try {
      const users = await this.service.getUsers();

      logger.info({
        layer: "controller",
        action: "USER_LIST_SUCCESS",
        userId,
        method: req.method,
        path: req.originalUrl,
        count: users.length,
      });

      res.status(200).json({
        success: true,
        data: users,
        message: "Users retrieved successfully",
      });
    } catch (error) {
      logger.error({
        layer: "controller",
        action: "USER_LIST_ERROR",
        userId,
        method: req.method,
        path: req.originalUrl,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      next(
        new AppError("Failed to list users", 500, true, error instanceof Error ? error : undefined, {
          context: "AUTH_CONTROLLER",
          route: req.originalUrl,
          method: req.method,
          userId,
        })
      );
    }
  }

  async logoutUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const jti = req.user?.jti;
    const userId = req.user?.id;

    logger.info({
      layer: "controller",
      action: "USER_LOGOUT_ATTEMPT",
      userId,
      method: req.method,
      path: req.originalUrl,
      jti,
    });

    if (!jti) {
      logger.warn({
        layer: "controller",
        action: "USER_LOGOUT_JTI_MISSING",
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
        layer: "controller",
        action: "USER_LOGOUT_SUCCESS",
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
        layer: "controller",
        action: "USER_LOGOUT_ERROR",
        userId,
        method: req.method,
        path: req.originalUrl,
        jti,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      next(
        new AppError("Logout failed", 500, true, error instanceof Error ? error : undefined, {
          context: "AUTH_CONTROLLER",
          route: req.originalUrl,
          method: req.method,
          userId,
          jti,
        })
      );
    }
  }
}