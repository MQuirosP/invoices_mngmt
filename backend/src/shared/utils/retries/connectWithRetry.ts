// connectWithRetry.ts
import { logger } from "@/shared";
import { prisma } from "@/config/prisma";

export async function connectWithRetry(attempt = 1): Promise<void> {
  try {
    await prisma.$connect();
    logger.info({ action: "PRISMA_CONNECTED", attempt, context: "DB_LAYER" });
  } catch (err) {
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
    logger.warn({
      action: "PRISMA_CONNECT_RETRY",
      attempt,
      delay,
      error: (err as Error).message,
      context: "DB_LAYER",
    });

    if (attempt >= 5) {
      logger.error({
        action: "PRISMA_CONNECT_FAILED",
        error: (err as Error).message,
        context: "DB_LAYER",
      });
      throw err;
    }

    await new Promise((r) => setTimeout(r, delay));
    return connectWithRetry(attempt + 1);
  }
}