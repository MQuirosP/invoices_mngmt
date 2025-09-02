import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { logger } from "@/shared/utils/logging/logger";
import { Request, Response } from "express";

// 👇 Esta función es obligatoria para evitar el error de IPv6
const ipKeyGenerator = (req: Request): string => {
  const ip = req.ip ?? "unknown";
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
};

export const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,

  keyGenerator: (req: Request): string => {
    const ip = ipKeyGenerator(req); // ✅ usa el helper explícitamente
    const email = typeof req.body?.email === "string" ? req.body.email : "unknown";
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    const decoded = token ? jwt.decode(token) : null;
    const jti = typeof decoded === "object" && decoded !== null ? decoded.jti : "no-jti";

    return `${ip}|${email}|${jti}`;
  },

  handler: (req: Request, res: Response): void => {
    const ip = ipKeyGenerator(req); // ✅ también en el logger
    const email = typeof req.body?.email === "string" ? req.body.email : "unknown";
    const path = req.originalUrl;
    const method = req.method;
    const userAgent = req.headers["user-agent"] ?? "unknown";
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    const decoded = token ? jwt.decode(token) : null;
    const jti = typeof decoded === "object" && decoded !== null ? decoded.jti : "no-jti";

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