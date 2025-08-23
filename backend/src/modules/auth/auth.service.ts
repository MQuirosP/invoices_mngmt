import { Role, User } from "@prisma/client";
import { RegisterInput, LoginInput } from "./auth.schema";
import bcrypt from "bcrypt";
import { prisma } from "@/config/prisma";
import { AppError } from "@/shared/utils/appError.utils";
import { hashPassword } from "@/shared/utils/security/hashPassword";
import { logger } from "@/shared/utils/logging/logger";
import { getCachedUserByEmail, setCachedUser } from "@/shared/services/userCache.service";
import { signTokenWithJti } from "@/shared/utils/token/signTokenWithJti";

export class AuthService {
  async registerUser(data: RegisterInput) {
    logger.info({
      layer: "service",
      action: "USER_REGISTER_ATTEMPT",
      email: data.email,
      fullname: data.fullname,
      role: data.role ?? "USER",
    });

    const { email, password, fullname, role = "USER" } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      logger.warn({
        layer: "service",
        action: "USER_REGISTER_EXISTS",
        email,
      });
      throw new AppError("Email already registered", 409);
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);
    const hashedPassword = await hashPassword(password, saltRounds);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, fullname, role },
    });

    const { token } = await signTokenWithJti({
      sub: user.id,
      email: user.email,
      role: user.role as Role,
    });

    logger.info({
      layer: "service",
      action: "USER_REGISTER_SUCCESS",
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      role,
      token,
    };
  }

  async loginUser(data: LoginInput) {
    logger.info({
      layer: "service",
      action: "USER_LOGIN_ATTEMPT",
      email: data.email,
    });

    const { email, password } = data;

    let cachedUser = await getCachedUserByEmail(email);
    let user: User | null;

    if (cachedUser) {
      logger.info({
        layer: "service",
        action: "USER_LOGIN_CACHE_USED",
        email,
        cachedUserId: cachedUser.id,
      });
      user = await prisma.user.findUnique({ where: { id: cachedUser.id } });
    } else {
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      logger.warn({
        layer: "service",
        action: "USER_LOGIN_NOT_FOUND",
        email,
      });
      throw new AppError("User not found.", 404);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn({
        layer: "service",
        action: "USER_LOGIN_INVALID_PASSWORD",
        email,
        userId: user.id,
      });
      throw new AppError("Invalid password.", 401);
    }

    if (!cachedUser) {
      await setCachedUser(user);
      logger.info({
        layer: "service",
        action: "USER_LOGIN_CACHE_SET",
        userId: user.id,
        email,
      });
    }

    const { token } = await signTokenWithJti({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info({
      layer: "service",
      action: "USER_LOGIN_SUCCESS",
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
      token,
    };
  }

  async getUsers() {
    logger.info({
      layer: "service",
      action: "USER_LIST_ATTEMPT",
    });

    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
        },
      });

      logger.info({
        layer: "service",
        action: "USER_LIST_SUCCESS",
        count: users.length,
      });

      return users;
    } catch (error) {
      logger.error({
        layer: "service",
        action: "USER_LIST_ERROR",
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AppError("Failed to fetch users", 500);
    }
  }
}