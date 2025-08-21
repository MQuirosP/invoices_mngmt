import { logger } from "@/shared/utils/logger";
import { redis } from "../../../lib/redis";

export const revokeToken = async (
  jti: string,
  ttlSeconds = 604800 // 7 días
): Promise<void> => {
  const timestamp = new Date().toISOString();

  try {
    await redis.setex(`revoked:${jti}`, ttlSeconds, "1");

    logger.info({
      layer: "shared",
      module: "token",
      action: "TOKEN_REVOKED",
      jti,
      ttlSeconds,
      timestamp,
    });
  } catch (err) {
    logger.error({
      layer: "shared",
      module: "token",
      action: "TOKEN_REVOKE_ERROR",
      jti,
      ttlSeconds,
      error: err instanceof Error ? err.message : String(err),
      timestamp,
    });

    throw new Error("Failed to revoke token");
  }
};