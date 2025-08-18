// src/shared/utils/revokeToken.ts
import { logger } from "@/shared/utils/logger";
import { redis } from "../../../lib/redis";

export const revokeToken = async (jti: string, ttlSeconds = 604800) => {
  try {
    await redis.setex(`revoked:${jti}`, ttlSeconds, "1");
    logger.info({ jti, action: "TOKEN_REVOKED" });
  } catch (err) {
    logger.error({
      action: "TOKEN_REVOKE_ERROR",
      jti,
      error: err instanceof Error ? err.message : String(err),
    });
    throw new Error("Failed to revoke token");
  }
};