// src/lib/redis/verifyRedisConnection.ts
import { logger } from "@/shared/utils/logger";
import { redis } from "./redis";

export async function verifyRedisConnection(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    if (pong !== "PONG") throw new Error(`Unexpected Redis ping response: ${pong}`);

    logger.info({
      action: "REDIS_PING_SUCCESS",
      response: pong,
      context: "REDIS_LAYER",
    });

    return true;
  } catch (err) {
    logger.error({
      action: "REDIS_PING_FAILED",
      error: err instanceof Error ? err.message : String(err),
      context: "REDIS_LAYER",
    });

    return false;
  }
}