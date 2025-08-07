import { Router } from "express";
import authRouter from "@/modules/auth/auth.routes";
import invoiceRouter from "@/modules/invoice/invoice.routes";
import { logger } from "../shared/utils/logger";
import { redis } from "../lib/redis";
import { prisma } from "../config/prisma";

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

  try {
    // Redis touch
    await redis.set(`ping:${jobId}`, Date.now().toString(), "EX", 60);

    // Optional DB touch
    const invoiceCount = await prisma.invoice.count();

    // Logging estructurado
    logger.info({
      action: "PING_RECEIVED",
      context: "KEEP_ALIVE",
      jobId,
      env,
      invoiceCount,
      timestamp: new Date().toISOString(),
    });

    res.json({ status: "ok", invoiceCount });
  } catch (err) {
    logger.error({
      action: "PING_ERROR",
      context: "KEEP_ALIVE",
      error: err,
      jobId,
      env,
    });
    res.status(500).json({ status: "error" });
  }
});

export default router;
