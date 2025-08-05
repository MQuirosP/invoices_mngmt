import Redis from "ioredis";
import { logger } from "@/shared/utils/logger";

// Detectar si estamos usando URL o host/port
const isUsingUrl = !!process.env.REDIS_URL;

const redis = isUsingUrl
  ? new Redis(process.env.REDIS_URL!, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        logger.warn({
          action: "REDIS_RETRY",
          attempt: times,
          delay,
          context: "CACHE_LAYER",
        });
        return delay;
      },
    })
  : new Redis({
      host: process.env.REDIS_HOST ?? "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
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
    context: "CACHE_LAYER",
    ...(isUsingUrl
      ? { url: process.env.REDIS_URL }
      : {
          host: process.env.REDIS_HOST ?? "127.0.0.1",
          port: process.env.REDIS_PORT ?? "6379",
        }),
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

export async function verifyRedisConnection() {
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