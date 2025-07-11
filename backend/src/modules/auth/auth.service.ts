import { RegisterInput, LoginInput } from "./auth.schemas";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/config/prisma";
import { AppError } from "@/shared/utils/AppError.utils";

export const registerUser = async (data: RegisterInput) => {
  const { email, password, fullname } = data;
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  // Hash password
  const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullname,
    },
  });

  // Generate JWT token
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return {
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    token,
  };
};

export const loginUser = async (data: LoginInput) => {
  const { email, password } = data;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid password.", 401);
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" } 
  );

  return {
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    token,
  }
}