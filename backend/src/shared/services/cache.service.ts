import { logger } from "@/shared/utils/logger";
import { redis } from "@/lib/redis";
import { AppError } from "../utils/AppError";

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await redis.get(key);

      if (!raw) {
        logger.warn({
          layer: "service",
          module: "cache",
          action: "CACHE_MISS",
          key,
          timestamp: new Date().toISOString(),
        });
        return null;
      }

      logger.info({
        layer: "service",
        module: "cache",
        action: "CACHE_HIT",
        key,
        raw,
        timestamp: new Date().toISOString(),
      });

      try {
        return JSON.parse(raw) as T;
      } catch (parseError) {
        logger.error({
          layer: "service",
          module: "cache",
          action: "CACHE_PARSE_FAILED",
          key,
          raw,
          error: parseError instanceof Error ? parseError.message : String(parseError),
          timestamp: new Date().toISOString(),
        });
        return null;
      }
    } catch (error) {
      logger.error({
        layer: "service",
        module: "cache",
        action: "CACHE_GET_FAILED",
        key,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const payload = JSON.stringify(value);

      if (ttlSeconds) {
        await redis.set(key, payload, "EX", ttlSeconds);
      } else {
        await redis.set(key, payload);
      }

      logger.info({
        layer: "service",
        module: "cache",
        action: "CACHE_SET_SUCCESS",
        key,
        ttlSeconds,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({
        layer: "service",
        module: "cache",
        action: "CACHE_SET_FAILED",
        key,
        error: error instanceof Error ? error.message : String(error),
        reason: "REDIS_SET_ERROR",
        timestamp: new Date().toISOString(),
      });
      throw new AppError("Redis set failed", 500);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
      logger.info({
        layer: "service",
        module: "cache",
        action: "CACHE_DEL_SUCCESS",
        key,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({
        layer: "service",
        module: "cache",
        action: "CACHE_DEL_FAILED",
        key,
        error: error instanceof Error ? error.message : String(error),
        reason: "REDIS_DEL_ERROR",
        timestamp: new Date().toISOString(),
      });
      throw new AppError("Redis del failed", 500);
    }
  },
};