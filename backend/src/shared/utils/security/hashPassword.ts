import bcrypt from "bcrypt";
import { AppError } from "@/shared/utils/AppError";
import { logger } from "@/shared";

export async function hashPassword(password: string, saltRounds: number): Promise<string> {
  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    logger.error({
      message: "Password hashing failed",
      saltRounds,
      error: error instanceof Error ? error.message : String(error),
      context: "AUTH_SERVICE",
    });

    throw new AppError(
      "Failed to hash password",
      500,
      true,
      error instanceof Error ? error : undefined,
      {
        saltRounds,
        context: "AUTH_SERVICE",
      }
    );
  }
}