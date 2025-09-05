import { Role } from "@prisma/client";
import { RegisterInput, LoginInput } from "./auth.schema";
import bcrypt from "bcrypt";
import { hashPassword } from "@/shared/utils/security/hashPassword";
import { signTokenWithJti } from "@/shared/utils/token/signTokenWithJti";
import { logger, AppError } from "@/shared";
import { UserRepository } from "./user.repository";

const userRepo = UserRepository;

export const AuthService = {
  registerUser: async (data: RegisterInput) => {
    logger.info({ layer: "service", action: "USER_REGISTER_ATTEMPT", email: data.email });

    const existing = await userRepo.findByEmail(data.email);
    if (existing) throw new AppError("Email already registered", 409);

    const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);
    const hashedPassword = await hashPassword(data.password, saltRounds);

    const user = await userRepo.createUser({
      email: data.email,
      password: hashedPassword,
      fullname: data.fullname,
      role: (data.role ?? "USER") as Role,
    });

    const { token } = await signTokenWithJti({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info({ layer: "service", action: "USER_REGISTER_SUCCESS", userId: user.id });

    return {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
      token,
    };
  },

  loginUser: async (data: LoginInput) => {
    logger.info({ layer: "service", action: "USER_LOGIN_ATTEMPT", email: data.email });

    const user = await userRepo.findByEmail(data.email);
    if (!user) {
      logger.warn({ layer: "service", action: "USER_NOT_FOUND", email: data.email });
      throw new AppError("No account found with that email.", 404);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      logger.warn({ layer: "service", action: "INVALID_PASSWORD", email: data.email, userId: user.id });
      throw new AppError("Incorrect password.", 401);
    }

    const { token } = await signTokenWithJti({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info({ layer: "service", action: "USER_LOGIN_SUCCESS", userId: user.id, email: user.email });

    return {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      role: user.role,
      token,
    };
  },

  getUsers: async () => {
    return userRepo.findAll();
  },
};