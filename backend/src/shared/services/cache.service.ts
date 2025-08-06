import { logger } from "@/shared/utils/logger";
import { redis } from "@/lib/redis";
import { AppError } from "@/shared/utils/AppError.utils";

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await redis.get(key);
      if (!raw) {
        logger.warn({ key, context: "CACHE_SERVICE" }, "CACHE_MISS");
        return null;
      }

      logger.info({ key, context: "CACHE_SERVICE", raw }, "CACHE_HIT");

      try {
        return JSON.parse(raw) as T;
      } catch (parseError) {
        logger.error(
          { key, raw, parseError, context: "CACHE_SERVICE" },
          "CACHE_PARSE_FAILED"
        );
        return null;
      }
    } catch (error) {
      logger.error({ key, error, context: "CACHE_SERVICE" }, "CACHE_GET_FAILED");
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

      logger.info(
        { key, ttlSeconds, context: "CACHE_SERVICE" },
        "CACHE_SET_SUCCESS"
      );
    } catch (error) {
      logger.error(
        { key, error, context: "CACHE_SERVICE" },
        "CACHE_SET_FAILED"
      );
      throw new AppError("Redis set failed", 500);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
      logger.info({ key, context: "CACHE_SERVICE" }, "CACHE_DEL_SUCCESS");
    } catch (error) {
      logger.error(
        { key, error, context: "CACHE_SERVICE" },
        "CACHE_DEL_FAILED"
      );
      throw new AppError("Redis del failed", 500);
    }
  },
};