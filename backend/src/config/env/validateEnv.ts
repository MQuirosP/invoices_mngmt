import { AppError } from "@/shared/utils/appError.utils";
import { logger } from "@/shared";

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "REDIS_URL",
  "SALT_ROUNDS",
] as const;

type RequiredEnvVar = typeof REQUIRED_ENV_VARS[number];

export function validateEnvVars(): void {
  logger.info({
    layer: "config",
    action: "ENV_VALIDATION_ATTEMPT",
    validated: REQUIRED_ENV_VARS.length,
    timestamp: new Date().toISOString(),
  });

  const missing: RequiredEnvVar[] = REQUIRED_ENV_VARS.filter(
    (key) => !process.env[key]
  );

  if (missing.length > 0) {
    logger.error({
      layer: "config",
      action: "ENV_VALIDATION_ERROR",
      message: "Missing required environment variables",
      missing,
      validated: REQUIRED_ENV_VARS.length,
      timestamp: new Date().toISOString(),
    });

    throw new AppError(
      `Missing required environment variables: ${missing.join(", ")}`,
      500
    );
  }

  logger.info({
    layer: "config",
    action: "ENV_VALIDATION_SUCCESS",
    message: "All required environment variables are present",
    validated: REQUIRED_ENV_VARS.length,
    timestamp: new Date().toISOString(),
  });
}