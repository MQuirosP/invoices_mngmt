import rateLimit from "express-rate-limit";
import { logger } from "@/shared/utils/logger";
import jwt from "jsonwebtoken"; // solo si querés extraer jti

export const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // máximo 5 intentos

  handler: (req, res) => {
    const ip = req.ip;
    const email = req.body?.email;
    const path = req.originalUrl;
    const method = req.method;
    const userAgent = req.headers["user-agent"];

    // Extraer jti si hay JWT en el header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    const decoded = token ? jwt.decode(token) : null;
    const jti = typeof decoded === "object" ? decoded?.jti : undefined;

    logger.warn({
      action: "RATE_LIMIT_BLOCK",
      context: "AUTH_LOGIN",
      ip,
      email: email ?? "unknown",
      jti,
      path,
      method,
      userAgent,
      reason: "Too many login attempts",
    });

    res.status(429).json({
      error: "Too many login attempts. Please try again later.",
    });
  },

  standardHeaders: true,
  legacyHeaders: false,
});