import { redis } from "@/lib/redis";
import { User } from "@prisma/client";
import { logger } from "@/shared/utils/logging/logger";

const TTL_SECONDS = 3600;
type CachedUser = Pick<User, "id" | "email" | "fullname" | "role">;

export async function getCachedUserByEmail(email: string): Promise<CachedUser | null> {
  const key = `user:email:${email}`;
  const timestamp = new Date().toISOString();

  try {
    const cached = await redis.get(key);

    if (cached) {
      logger.info({
        layer: "service",
        module: "user-cache",
        action: "USER_CACHE_HIT",
        key,
        email,
        timestamp,
      });

      return JSON.parse(cached);
    }

    logger.info({
      layer: "service",
      module: "user-cache",
      action: "USER_CACHE_MISS",
      key,
      email,
      timestamp,
    });

    return null;
  } catch (error) {
    logger.error({
      layer: "service",
      module: "user-cache",
      action: "USER_CACHE_GET_FAILED",
      key,
      email,
      error: error instanceof Error ? error.message : String(error),
      timestamp,
    });

    return null;
  }
}

export async function setCachedUser(user: User): Promise<void> {
  const keyById = `user:${user.id}`;
  const keyByEmail = `user:email:${user.email}`;
  const timestamp = new Date().toISOString();

  const safeUser: CachedUser = {
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    role: user.role,
  };

  const serialized = JSON.stringify(safeUser);

  try {
    await redis.set(keyById, serialized, "EX", TTL_SECONDS);
    await redis.set(keyByEmail, serialized, "EX", TTL_SECONDS);

    logger.info({
      layer: "service",
      module: "user-cache",
      action: "USER_CACHE_SET",
      userId: user.id,
      email: user.email,
      ttlSeconds: TTL_SECONDS,
      timestamp,
    });
  } catch (error) {
    logger.error({
      layer: "service",
      module: "user-cache",
      action: "USER_CACHE_SET_FAILED",
      userId: user.id,
      email: user.email,
      error: error instanceof Error ? error.message : String(error),
      timestamp,
    });
  }
}