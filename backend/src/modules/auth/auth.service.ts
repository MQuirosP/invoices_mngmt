import { Role, User } from "@prisma/client";
import { RegisterInput, LoginInput } from "./auth.schema";
import bcrypt from "bcrypt";
import { prisma } from "@/config/prisma";
import { AppError } from "@/shared/utils/AppError";
import { hashPassword } from "@/shared/utils/security/hashPassword";
import { logger } from "@/shared/utils/logger";
import { getCachedUserByEmail, setCachedUser } from "@/shared/services/userCache.service";
import { signTokenWithJti } from "@/shared/utils/token/signTokenWithJti";

export class AuthService {
  async registerUser(data: RegisterInput) {
    logger.info({
      email: data.email,
      fullname: data.fullname,
      action: "REGISTER_ATTEMPT",
    });

    const { email, password, fullname, role = "USER" } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      logger.warn({ email, action: "REGISTER_USER_EXISTS" });
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

    logger.info({ email, action: "REGISTER_SUCCESS" });

    return {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      role,
      token,
    };
  }

  async loginUser(data: LoginInput) {
    logger.info({ email: data.email, action: "LOGIN_ATTEMPT" });

    const { email, password } = data;

    let cachedUser = await getCachedUserByEmail(email);
    let user: User | null;

    if (cachedUser) {
      logger.info({ email, action: "LOGIN_CACHE_USED", context: "CACHE_LAYER" });
      user = await prisma.user.findUnique({ where: { id: cachedUser.id } });
    } else {
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      logger.warn({ email, action: "LOGIN_USER_NOT_FOUND" });
      throw new AppError("User not found.", 404);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn({ email, action: "LOGIN_INVALID_PASSWORD" });
      throw new AppError("Invalid password.", 401);
    }

    if (!cachedUser) {
      await setCachedUser(user);
    }

    const { token } = await signTokenWithJti({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info({ userId: user.id, email: user.email, action: "LOGIN_SUCCESS" });

    return {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
      token,
    };
  }

  async getUsers() {
    logger.info({ action: "USERS_GET_ATTEMPT", context: "USER_SERVICE" });

    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullname: true,
          role: true,
        },
      });

      logger.info({ action: "USERS_GET_SUCCESS", count: users.length });
      return users;
    } catch (error) {
      logger.error({
        action: "USERS_GET_ERROR",
        context: "USER_SERVICE",
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AppError("Failed to fetch users", 500);
    }
  }
}