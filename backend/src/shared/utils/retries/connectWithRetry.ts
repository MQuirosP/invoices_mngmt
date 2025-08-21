import { logger } from "@/shared";
import { prisma } from "@/config/prisma";

export async function connectWithRetry(attempt = 1): Promise<void> {
  const timestamp = new Date().toISOString();

  try {
    await prisma.$connect();

    logger.info({
      layer: "shared",
      module: "db-retry",
      action: "PRISMA_CONNECTED",
      attempt,
      timestamp,
    });
  } catch (err) {
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);

    logger.warn({
      layer: "shared",
      module: "db-retry",
      action: "PRISMA_CONNECT_RETRY",
      attempt,
      delay,
      error: err instanceof Error ? err.message : String(err),
      timestamp,
    });

    if (attempt >= 5) {
      logger.error({
        layer: "shared",
        module: "db-retry",
        action: "PRISMA_CONNECT_FAILED",
        attempt,
        error: err instanceof Error ? err.message : String(err),
        reason: "MAX_RETRIES_EXCEEDED",
        timestamp,
      });

      throw err;
    }

    await new Promise((r) => setTimeout(r, delay));
    return connectWithRetry(attempt + 1);
  }
}