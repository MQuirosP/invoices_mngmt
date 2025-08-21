import rateLimit from "express-rate-limit";
import { logger } from "@/shared/utils/logger";
import jwt from "jsonwebtoken";

export const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // max 5 requests per windowMs

  handler: (req, res) => {
    const ip = req.ip;
    const email = req.body?.email ?? "unknown";
    const path = req.originalUrl;
    const method = req.method;
    const userAgent = req.headers["user-agent"];

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    const decoded = token ? jwt.decode(token) : null;
    const jti = typeof decoded === "object" ? decoded?.jti : undefined;

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