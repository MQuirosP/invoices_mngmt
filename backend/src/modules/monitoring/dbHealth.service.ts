import { prisma } from "@/config/prisma";
import { logger } from "@/shared/utils/logging/logger";

export async function checkDbHealth(jobId: string) {
  const startTime = Date.now();

  logger.info({
    layer: "service",
    action: "DB_HEALTH_ATTEMPT",
    jobId,
    timestamp: new Date().toISOString(),
  });

  try {
    await prisma.$queryRaw`SELECT 1`;

    logger.info({
      layer: "service",
      action: "DB_HEALTH_SUCCESS",
      jobId,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    });

    return { status: "ok", jobId };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));

    logger.error({
      layer: "service",
      action: "DB_HEALTH_ERROR",
      jobId,
      error: error.message,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    });

    throw new Error("DB unreachable");
  }
}