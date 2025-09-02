import rateLimit from "express-rate-limit";
import { logger } from "@/shared/utils/logging/logger";
import jwt from "jsonwebtoken";
import RedisStore from "rate-limit-redis";
import { redis } from "../../../lib/redis";
import { Request, Response } from "express";
import { Command } from "ioredis";

// ✅ Normaliza IP (IPv4 e IPv6)
const ipKeyGenerator = (req: Request): string => {
  const ip = req.ip ?? "unknown";
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
};

// ✅ Extrae token del header Authorization
const extractToken = (authHeader: string | undefined): string => {
  if (!authHeader) return "";
  const parts = authHeader.split(" ");
  return parts.length === 2 ? parts[1] : "";
};

// ✅ Extrae JTI del token decodificado
const extractJti = (token: string): string => {
  const decoded = jwt.decode(token);
  return typeof decoded === "object" && decoded !== null && "jti" in decoded
    ? String(decoded.jti)
    : "no-jti";
};

// ✅ Middleware de rate limit con Redis como store
export const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // máximo 5 intentos por ventana

  store: new RedisStore({
    sendCommand: (command: string, ...args: (string | number | Buffer)[]) => {
      return redis.sendCommand(new Command(command, args)) as Promise<any>;
    },
  }),

  keyGenerator: (req: Request): string => {
    const ip = ipKeyGenerator(req);
    const email =
      typeof req.body?.email === "string" ? req.body.email : "unknown";
    const token = extractToken(req.headers.authorization);
    const jti = extractJti(token);
    return `${ip}|${email}|${jti}`;
  },

  handler: (req: Request, res: Response): void => {
    const ip = ipKeyGenerator(req);
    const email =
      typeof req.body?.email === "string" ? req.body.email : "unknown";
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
