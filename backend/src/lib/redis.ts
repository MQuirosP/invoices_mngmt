import Redis from "ioredis";
import { logger } from "@/shared/utils/logging/logger";

if (!process.env.REDIS_URL) {
  logger.error({
    layer: "infrastructure",
    action: "REDIS_CONFIG_MISSING",
    message: "Missing REDIS_URL in environment",
    timestamp: new Date().toISOString(),
  });
  throw new Error("Missing REDIS_URL in environment");
}

const redis = new Redis(process.env.REDIS_URL, {
  retryStrategy: (times) => {
    const delay = Math.min(50 * Math.pow(2, times), 5000);
    logger.warn({
      layer: "infrastructure",
      action: "REDIS_RETRY",
      attempt: times,
      delay,
      timestamp: new Date().toISOString(),
    });
    return delay;
  },
});

redis.on("connect", () => {
  logger.info({
    layer: "infrastructure",
    action: "REDIS_CONNECT_SUCCESS",
    url: process.env.REDIS_URL,
    timestamp: new Date().toISOString(),
  });
});

redis.on("error", (err) => {
  logger.error({
    layer: "infrastructure",
    action: "REDIS_CONNECT_ERROR",
    error: err.message,
    timestamp: new Date().toISOString(),
  });
});

redis.on("end", () => {
  logger.warn({
    layer: "infrastructure",
    action: "REDIS_DISCONNECTED",
    timestamp: new Date().toISOString(),
  });
});

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

export { redis };