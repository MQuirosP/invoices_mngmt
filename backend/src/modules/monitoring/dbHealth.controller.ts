import { Request, Response } from "express";
import { checkDbHealth } from "./dbHealth.service";
import { logger } from "@/shared/utils/logger";

export async function handleDbHealth(req: Request, res: Response) {
  const jobId = req.header("X-Job-ID") || "unknown";

  logger.info({
    layer: "controller",
    action: "DB_HEALTH_CHECK_ATTEMPT",
    jobId,
    method: req.method,
    path: req.originalUrl,
  });

  try {
    const result = await checkDbHealth(jobId);

    logger.info({
      layer: "controller",
      action: "DB_HEALTH_CHECK_SUCCESS",
      jobId,
      method: req.method,
      path: req.originalUrl,
      status: result.status,
    });

    res.json(result);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));

    logger.error({
      layer: "controller",
      action: "DB_HEALTH_CHECK_ERROR",
      jobId,
      method: req.method,
      path: req.originalUrl,
      error: error.message,
    });

    res.status(500).json({ error: error.message, jobId });
  }
}