import rateLimit from "express-rate-limit";
import { logger } from "@/shared/utils/logger";

export const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    logger.warn({
      action: "RATE_LIMIT_BLOCK",
      context: "AUTH_LOGIN",
      ip: req.ip,
      email: req.body?.email,
      reason: "Too many login attempts",
    });

    res.status(429).json({
      error: "Too many login attempts. Please try again later.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});