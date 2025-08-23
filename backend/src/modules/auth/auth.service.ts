// modules/auth/auth.service.ts
import { Role } from "@prisma/client";
import { RegisterInput, LoginInput } from "./auth.schema";
import bcrypt from "bcrypt";
import { hashPassword } from "@/shared/utils/security/hashPassword";
import { signTokenWithJti } from "@/shared/utils/token/signTokenWithJti";
import { logger, AppError } from "../../shared";
import { UserRepository } from "./user.repository";

export class AuthService {
  private readonly userRepo: UserRepository;

  constructor(userRepo?: UserRepository) {
    this.userRepo = userRepo ?? new UserRepository();
  }

  async registerUser(data: RegisterInput) {
    logger.info({ layer: "service", action: "USER_REGISTER_ATTEMPT", email: data.email });

    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new AppError("Email already registered", 409);
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);
    const hashedPassword = await hashPassword(data.password, saltRounds);

    const user = await this.userRepo.createUser({
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

    return { id: user.id, email: user.email, fullname: user.fullname, role: user.role, token };
  }

  async loginUser(data: LoginInput) {
    logger.info({ layer: "service", action: "USER_LOGIN_ATTEMPT", email: data.email });

    const user = await this.userRepo.findByEmail(data.email);
    if (!user) throw new AppError("User not found.", 404);

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new AppError("Invalid password.", 401);

    const { token } = await signTokenWithJti({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { id: user.id, email: user.email, fullname: user.fullname, role: user.role, token };
  }

  async getUsers() {
    return this.userRepo.findAll();
  }
}
