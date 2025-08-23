import bcrypt from "bcrypt";
import { AppError } from "@/shared/utils/appError.utils";
import { logger } from "@/shared";

export async function hashPassword(password: string, saltRounds: number): Promise<string> {
  const timestamp = new Date().toISOString();

  try {
    const hashed = await bcrypt.hash(password, saltRounds);

    logger.info({
      layer: "shared",
      module: "security",
      action: "PASSWORD_HASH_SUCCESS",
      saltRounds,
      timestamp,
    });

    return hashed;
  } catch (error) {
    logger.error({
      layer: "shared",
      module: "security",
      action: "PASSWORD_HASH_FAILED",
      saltRounds,
      error: error instanceof Error ? error.message : String(error),
      reason: "BCRYPT_ERROR",
      timestamp,
    });

    throw new AppError("Failed to hash password", 500, true, error instanceof Error ? error : undefined, {
      layer: "shared",
      module: "security",
      reason: "BCRYPT_ERROR",
      saltRounds,
      timestamp,
    });
  }
}