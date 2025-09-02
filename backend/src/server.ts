import app from "@/app";
import { logger } from "@/shared/utils/logging/logger";
import { connectWithRetry } from "@/shared/utils/retries/connectWithRetry";
import { verifyRedisConnection } from "./lib/redis";
import { setupEnv } from "@/config";

async function bootstrap() {
  logger.info({ layer: "bootstrap", action: "BOOT_ATTEMPT", timestamp: new Date().toISOString() });

  setupEnv();
  await connectWithRetry();

  const redisAvailable = await verifyRedisConnection();
  if (!redisAvailable) {
    logger.warn({
      layer: "bootstrap",
      action: "REDIS_CONNECTION_FAILED",
      message: "Revocation and caching will be desables",
      timestamp: new Date().toISOString(),
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info({
      msg: `Server is running on port ${PORT}`,
      layer: "bootstrap",
      action: "SERVER_STARTED",
      port: PORT,
      redisAvailable,
      timestamp: new Date().toISOString(),
    });
  });
}

bootstrap().catch((err) => {
  logger.error({
    layer: "bootstrap",
    action: "BOOT_FAILED",
    error: err instanceof Error ? err.message : String(err),
    timestamp: new Date().toISOString(),
  });
  process.exit(1);
});

export default bootstrap;