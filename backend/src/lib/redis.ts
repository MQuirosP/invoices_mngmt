import { createClient } from "redis";
import { logger } from "@/shared/utils/logging/logger";

const redis = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      const delay = Math.min(50 * Math.pow(2, retries), 5000);
      logger.warn({
        layer: "infrastructure",
        action: "REDIS_RETRY",
        attempt: retries,
        delay,
        timestamp: new Date().toISOString(),
      });
      return delay;
    },
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
    error: err instanceof Error ? err.message : String(err),
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

export async function initializeRedis(): Promise<boolean> {
  try {
    await redis.connect();
    return true;
  } catch (err) {
    logger.error({
      layer: "infrastructure",
      action: "REDIS_CONNECT_ERROR",
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });
    return false;
  }
}

export { redis };