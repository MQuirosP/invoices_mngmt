// src/shared/utils/signTokenWithJti.ts
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { Role } from "@prisma/client";
import { logger } from "@/shared/utils/logger";
import { redis } from "../../../lib/redis";

export const signTokenWithJti = async (payload: {
  sub: string;
  email: string;
  role: Role;
}) => {
  const jti = randomUUID();

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
    await redis.setex(`issued:${jti}`, 604800, payload.sub); // 7 days
    logger.debug({ jti, userId: payload.sub, action: "JTI_REGISTERED" });
  } catch (err) {
    logger.error({
      action: "JTI_REGISTER_ERROR",
      jti,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { token, jti };
};