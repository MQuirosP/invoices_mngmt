import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { Role } from "@prisma/client";
import { logger } from "@/shared/utils/logging/logger";
import { redis } from "../../../lib/redis";

interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export const signTokenWithJti = async (
  payload: TokenPayload
): Promise<{ token: string; jti: string }> => {
  const jti = randomUUID();
  const timestamp = new Date().toISOString();

  const token = jwt.sign(
    {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      jti,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  try {
    await redis.setex(`issued:${jti}`, 604800, payload.sub);

    logger.debug({
      layer: "shared",
      module: "token",
      action: "JTI_REGISTERED",
      jti,
      userId: payload.sub,
      ttlSeconds: 604800,
      timestamp,
    });
  } catch (err) {
    logger.error({
      layer: "shared",
      module: "token",
      action: "JTI_REGISTER_ERROR",
      jti,
      userId: payload.sub,
      ttlSeconds: 604800,
      error: err instanceof Error ? err.message : String(err),
      timestamp,
    });
  }

  return { token, jti };
};