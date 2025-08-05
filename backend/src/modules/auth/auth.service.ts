import { Role } from "@prisma/client";
import { RegisterInput, LoginInput } from "./auth.schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/config/prisma";
import { AppError } from "@/shared/utils/AppError.utils";
import { hashPassword } from "@/shared/utils/hashPassword";
import { logger } from "@/shared/utils/logger";
import { getCachedUserByEmail, setCachedUser } from "../../cache/userCache";

export const registerUser = async (data: RegisterInput) => {
  logger.info({ email: data.email, fullname: data.fullname, action: "REGISTER_ATTEMPT" });
  const { email, password, fullname, role = "USER" } = data;
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    logger.warn({ email: data.email, action: "REGISTER_USER_EXISTS" });
    throw new AppError("Email already registered", 409);
  }

  // Hash password
  const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);
  const hashedPassword = await hashPassword(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullname,
      role,
    },
  });

  // Generate JWT token
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role as Role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  logger.info({ email: data.email, action: "REGISTER_SUCCESS" });
  return {
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    role,
    token,
  };
};

export const loginUser = async (data: LoginInput) => {
  logger.info({ email: data.email, action: "LOGIN_ATTEMPT" });
  const { email, password } = data;

  // Try get user from Redis
  let user = await getCachedUserByEmail(email);

  //  If not cached, look into DB
  if (!user) {
    user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      logger.warn({ email, action: "LOGIN_USER_NOT_FOUND" });
      throw new AppError("User not found.", 404);
    }

    //  Save in Redis to future access
    await setCachedUser(user);
  }

  //  Validate password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    logger.warn({ email, action: "LOGIN_INVALID_PASSWORD" });
    throw new AppError("Invalid password.", 401);
  }

  //  Generate token
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role as Role },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  logger.info({ userId: user.id, email: user.email, action: "LOGIN_SUCCESS" });

  return {
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    role: user.role,
    token,
  };
};
