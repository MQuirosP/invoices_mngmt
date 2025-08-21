import { logger } from "@/shared/utils/logger";
import { redis } from "./redis";

export async function verifyRedisConnection(): Promise<boolean> {
  logger.info({
    layer: "infrastructure",
    action: "REDIS_PING_ATTEMPT",
    timestamp: new Date().toISOString(),
  });

  try {
    const pong = await redis.ping();
    if (pong !== "PONG") {
      throw new Error(`Unexpected Redis ping response: ${pong}`);
    }

    logger.info({
      layer: "infrastructure",
      action: "REDIS_PING_SUCCESS",
      response: pong,
      timestamp: new Date().toISOString(),
    });

    return true;
  } catch (err) {
    logger.error({
      layer: "infrastructure",
      action: "REDIS_PING_FAILED",
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });

    return false;
  }
}