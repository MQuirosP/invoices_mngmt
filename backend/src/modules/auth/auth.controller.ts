import { Request, Response, NextFunction } from "express";
import { loginSchema, registerSchema } from "./auth.schema";
import { ZodError } from "zod";
import { logger } from "@/shared/utils/logging/logger";
import { AuthService } from "./auth.service";
import { AuthRequest } from "./auth.types";
import { revokeToken } from "@/shared/utils/token/revokeToken";

const authService = AuthService;

export const AuthController = {
  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info({
      layer: "controller",
      action: "USER_REGISTER_ATTEMPT",
      method: req.method,
      path: req.originalUrl,
      payload: req.body,
    });

    try {
      const parsed = registerSchema.parse(req.body);
      const result = await authService.registerUser(parsed);

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
      if (error instanceof ZodError) {
        logger.warn({
          layer: "controller",
          action: "USER_REGISTER_VALIDATION_FAILED",
          method: req.method,
          path: req.originalUrl,
          issues: error.errors,
        });

        res.status(400).json({
          success: false,
          message: "Invalid input. Please check your name, email and password.",
          issues: error.errors,
        });
        return;
      }

      logger.error({
        layer: "controller",
        action: "USER_REGISTER_ERROR",
        method: req.method,
        path: req.originalUrl,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      next(error);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    logger.info({
      layer: "controller",
      action: "USER_LOGIN_ATTEMPT",
      method: req.method,
      path: req.originalUrl,
      payload: req.body,
    });

    try {
      const parsed = loginSchema.parse(req.body);
      const result = await authService.loginUser(parsed);

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
      if (error instanceof ZodError) {
        logger.warn({
          layer: "controller",
          action: "USER_LOGIN_VALIDATION_FAILED",
          method: req.method,
          path: req.originalUrl,
          issues: error.errors,
        });

        res.status(400).json({
          success: false,
          message: "Invalid input. Please check your email and password.",
          issues: error.errors,
        });
        return;
      }

      logger.error({
        layer: "controller",
        action: "USER_LOGIN_ERROR",
        method: req.method,
        path: req.originalUrl,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      next(error);
    }
  },

  listUsers: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.id;

    logger.info({
      layer: "controller",
      action: "USER_LIST_ATTEMPT",
      userId,
      method: req.method,
      path: req.originalUrl,
    });

    try {
      const users = await authService.getUsers();

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

      next(error);
    }
  },

  logoutUser: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
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

      next(error);
    }
  },
};

export type AuthControllerType = typeof AuthController;