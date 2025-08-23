import { Router } from "express";
import invoiceRouter from "@/routes/invoice.routes";
import { logger } from "../shared/utils/logging/logger";
import { redis } from "../lib/redis";
import { prisma } from "../config/prisma";
import authRouter from "./auth.routes";

const router = Router();

// Fake endpoint for test
router.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Auth module
router.use("/auth", authRouter);

// Invoice module
router.use("/invoices", invoiceRouter);

// Keep-alive ping endpoint
router.get("/ping", async (req, res) => {
  const jobId = req.headers["x-job-id"] || "unknown";
  const env = req.headers["x-env"] || "unknown";

  logger.info({
    layer: "router",
    action: "PING_ATTEMPT",
    jobId,
    env,
    timestamp: new Date().toISOString(),
  });

  try {
    await redis.set(`ping:${jobId}`, Date.now().toString(), "EX", 60);
    const invoiceCount = await prisma.invoice.count();

    logger.info({
      layer: "router",
      action: "PING_SUCCESS",
      jobId,
      env,
      invoiceCount,
      timestamp: new Date().toISOString(),
    });

    res.json({ status: "ok", invoiceCount });
  } catch (err) {
    logger.error({
      layer: "router",
      action: "PING_ERROR",
      jobId,
      env,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({ status: "error" });
  }
});

// Health check for DB
router.get("/health/db", async (req, res) => {
  const jobId = req.headers["x-job-id"] || "unknown";

  logger.info({
    layer: "router",
    action: "DB_HEALTH_ATTEMPT",
    jobId,
    timestamp: new Date().toISOString(),
  });

  try {
    await prisma.$queryRaw`SELECT 1`;

    logger.info({
      layer: "router",
      action: "DB_HEALTH_SUCCESS",
      jobId,
      timestamp: new Date().toISOString(),
    });

    res.json({ status: "ok", jobId });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));

    logger.error({
      layer: "router",
      action: "DB_HEALTH_ERROR",
      jobId,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({ error: error.message, jobId });
  }
});

export default router;