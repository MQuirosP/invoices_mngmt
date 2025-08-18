import Redis from "ioredis";
import { logger } from "@/shared/utils/logger";

// Validación estricta
if (!process.env.REDIS_URL) {
  throw new Error("Missing REDIS_URL in environment");
}

const redis = new Redis(process.env.REDIS_URL, {
  retryStrategy: (times) => {
    const delay = Math.min(50 * Math.pow(2, times), 5000); // Exponential backoff with a max delay of 5 seconds
    logger.warn({
      action: "REDIS_RETRY",
      attempt: times,
      delay,
      context: "CACHE_LAYER",
    });
    return delay;
  },
});

redis.on("connect", () => {
  logger.info({
    action: "REDIS_CONNECTED",
    url: process.env.REDIS_URL,
    context: "CACHE_LAYER",
  });
});

redis.on("error", (err) => {
  logger.error({
    action: "REDIS_CONNECTION_ERROR",
    error: err.message,
    context: "CACHE_LAYER",
  });
});

redis.on("end", () => {
  logger.warn({
    action: "REDIS_DISCONNECTED",
    context: "CACHE_LAYER",
  });
});

export async function verifyRedisConnection(): Promise<void> {
  try {
    const pong = await redis.ping();
    logger.info({
      action: "REDIS_PING_SUCCESS",
      response: pong,
      context: "CACHE_LAYER",
    });
  } catch (err) {
    logger.error({
      action: "REDIS_PING_FAILED",
      error: (err as Error).message,
      context: "CACHE_LAYER",
    });
  }
}

export { redis };