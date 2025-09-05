import { Router } from "express";
import invoiceRouter from "@/routes/invoice.routes";
import { logger } from "../shared/utils/logging/logger";
import { redis } from "../lib/redis";
import { prisma } from "../config/prisma";
import authRouter from "./auth.routes";
import viewImageRouter from "./view-image";
import { authenticate } from "../modules/auth";

const router = Router();

// Fake endpoint for test
router.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Auth module
router.use("/auth", authRouter);

// Invoice module
router.use("/invoices", invoiceRouter);

router.use("/view-image", authenticate, viewImageRouter);

// Keep-alive ping endpoint
router.get("/ping", async (req, res) => {
  const rawJobId =
    req.headers["x-job-id"]?.toString() ||
    req.query.jobId?.toString() ||
    "unknown";

  const env =
    req.headers["x-env"]?.toString() ||
    req.query.env?.toString() ||
    "unknown";

  const userAgent = req.headers["user-agent"] || "";
  const source =
    req.query.source?.toString() ||
    req.headers["x-source"]?.toString() ||
    (userAgent.includes("cron-job.org")
      ? "cron-job.org"
      : userAgent.includes("GitHub")
      ? "github-actions"
      : "unknown");

  const jobId =
    rawJobId === "unknown" && source === "cron-job.org"
      ? `cronjob-${new Date().toISOString()}`
      : rawJobId;

  logger.info({
    layer: "router",
    action: "PING_ATTEMPT",
    message: `Incoming ping detected — jobId: ${jobId}, env: ${env}, source: ${source}`,
    jobId,
    env,
    source,
    timestamp: new Date().toISOString(),
  });

  try {
    await redis.set(`ping:${jobId}`, Date.now().toString(), "EX", 60);
    const invoiceCount = await prisma.invoice.count();

    logger.info({
      layer: "router",
      action: "PING_SUCCESS",
      message: `Ping completed — jobId: ${jobId}, env: ${env}, source: ${source}, invoices: ${invoiceCount}`,
      jobId,
      env,
      source,
      invoiceCount,
      timestamp: new Date().toISOString(),
    });

    res.json({ status: "ok", invoiceCount });
  } catch (err) {
    logger.error({
      layer: "router",
      action: "PING_ERROR",
      message: `Ping failed — jobId: ${jobId}, env: ${env}, source: ${source}, reason: ${err instanceof Error ? err.message : String(err)}`,
      jobId,
      env,
      source,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({ status: "error" });
  }
});

// Health check for DB
router.get("/health/db", async (req, res) => {
  const rawJobId =
    req.headers["x-job-id"]?.toString() ||
    req.query.jobId?.toString() ||
    "unknown";

  const userAgent = req.headers["user-agent"] || "";
  const source =
    req.query.source?.toString() ||
    req.headers["x-source"]?.toString() ||
    (userAgent.includes("cron-job.org")
      ? "cron-job.org"
      : userAgent.includes("GitHub")
      ? "github-actions"
      : "unknown");

  const jobId =
    rawJobId === "unknown" && source === "cron-job.org"
      ? `cronjob-${new Date().toISOString()}`
      : rawJobId;

  logger.info({
    layer: "router",
    action: "DB_HEALTH_ATTEMPT",
    message: `DB health check initiated — jobId: ${jobId}, source: ${source}`,
    jobId,
    source,
    timestamp: new Date().toISOString(),
  });

  try {
    await prisma.$queryRaw`SELECT 1`;

    logger.info({
      layer: "router",
      action: "DB_HEALTH_SUCCESS",
      message: `Database heartbeat confirmed — jobId: ${jobId}, source: ${source}`,
      jobId,
      source,
      timestamp: new Date().toISOString(),
    });

    res.json({ status: "ok", jobId });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));

    logger.error({
      layer: "router",
      action: "DB_HEALTH_ERROR",
      message: `DB health check failed — jobId: ${jobId}, source: ${source}, reason: ${error.message}`,
      jobId,
      source,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({ error: error.message, jobId });
  }
});

export default router;