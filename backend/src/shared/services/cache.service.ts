import { logger } from "@/shared/utils/logger";
import { redis } from "@/lib/redis";

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await redis.get(key);
      if (!raw) {
        logger.warn({ key }, "CACHE_MISS");
        return null;
      }
      logger.info({ key }, "CACHE_HIT");
      return JSON.parse(raw) as T;
    } catch (error) {
      logger.error({ key, error }, "CACHE_GET_FAILED");
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
      logger.info({ key, ttlSeconds }, "CACHE_SET_SUCCESS");
    } catch (error) {
      logger.error({ key, error }, "CACHE_SET_FAILED");
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
      logger.info({ key }, "CACHE_DEL_SUCCESS");
    } catch (error) {
      logger.error({ key, error }, "CACHE_DEL_FAILED");
    }
  },
};