import { validateEnvVars } from "@/config/validateEnv";
import app from "./app";
import { logger } from "@/shared/utils/logger";
import { connectWithRetry } from "@/shared/utils/retries/connectWithRetry";
import { verifyRedisConnection } from "./lib/verifyRedisConnection";

async function bootstrap() {
  logger.info({
    layer: "bootstrap",
    action: "BOOT_ATTEMPT",
    timestamp: new Date().toISOString(),
  });

  validateEnvVars();
  await connectWithRetry();

  const redisAvailable = await verifyRedisConnection();

  if (!redisAvailable) {
    logger.warn({
      layer: "bootstrap",
      action: "REDIS_UNAVAILABLE_AT_BOOT",
      message: "Revocation and caching will be disabled",
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
    // console.log(`Server is running on port ${PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.fatal({
    layer: "bootstrap",
    action: "BOOT_ERROR",
    error: err instanceof Error ? err.message : String(err),
    timestamp: new Date().toISOString(),
  });
  process.exit(1);
});