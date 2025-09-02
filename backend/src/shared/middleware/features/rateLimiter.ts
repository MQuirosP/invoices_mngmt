import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../../../lib/redis";
import { logger } from "@/shared/utils/logging/logger";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";

// IP normalizada
const ipKeyGenerator = (req: Request): string => {
  const ip = req.ip ?? "unknown";
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
};

// Token extractor
const extractToken = (authHeader: string | undefined): string => {
  if (!authHeader) return "";
  const parts = authHeader.split(" ");
  return parts.length === 2 ? parts[1] : "";
};

// JTI extractor
const extractJti = (token: string): string => {
  const decoded = jwt.decode(token);
  return typeof decoded === "object" && decoded !== null && "jti" in decoded
    ? String(decoded.jti)
    : "no-jti";
};

// Rate limiter con RedisStore
export const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,

  store: new RedisStore({
    sendCommand: (...args) => redis.sendCommand(args),
  }),

  keyGenerator: (req: Request): string => {
    const ip = ipKeyGenerator(req);
    const email = typeof req.body?.email === "string" ? req.body.email : "unknown";
    const token = extractToken(req.headers.authorization);
    const jti = extractJti(token);
    return `${ip}|${email}|${jti}`;
  },

  handler: (req: Request, res: Response): void => {
    const ip = ipKeyGenerator(req);
    const email = typeof req.body?.email === "string" ? req.body.email : "unknown";
    const path = req.originalUrl;
    const method = req.method;
    const userAgent = req.headers["user-agent"] ?? "unknown";
    const token = extractToken(req.headers.authorization);
    const jti = extractJti(token);

    logger.warn({
      layer: "middleware",
      action: "RATE_LIMIT_BLOCK",
      ip,
      email,
      jti,
      path,
      method,
      userAgent,
      reason: "Too many login attempts",
      timestamp: new Date().toISOString(),
    });

    res.status(429).json({
      error: "Too many login attempts. Please try again later.",
    });
  },

  standardHeaders: true,
  legacyHeaders: false,
});