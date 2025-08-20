import { redis } from "@/lib/redis";
import { User } from "@prisma/client";
import { logger } from "@/shared/utils/logger";

const TTL_SECONDS = 3600;
type CachedUser = Pick<User, "id" | "email" | "fullname" | "role">;

export async function getCachedUserByEmail(email: string): Promise<CachedUser | null> {
  const key = `user:email:${email}`;
  const cached = await redis.get(key);

  if (cached) {
    logger.info({ email, action: "USER_CACHE_HIT", context: "CACHE_LAYER" });
    return JSON.parse(cached);
  }

  logger.info({ email, action: "USER_CACHE_MISS", context: "CACHE_LAYER" });
  return null;
}

export async function setCachedUser(user: User): Promise<void> {
  const keyById = `user:${user.id}`;
  const keyByEmail = `user:email:${user.email}`;

  const safeUser: CachedUser = {
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    role: user.role,
  };

  const serialized = JSON.stringify(safeUser);

  await redis.set(keyById, serialized, "EX", TTL_SECONDS);
  await redis.set(keyByEmail, serialized, "EX", TTL_SECONDS);

  logger.info({ userId: user.id, email: user.email, action: "USER_CACHE_SET", context: "CACHE_LAYER" });
}