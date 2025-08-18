import { validateEnvVars } from "@/config/validateEnv";
import app from "./app";
import { logger } from "@/shared/utils/logger";
import { connectWithRetry } from "@/shared/utils/retries/connectWithRetry";
import { verifyRedisConnection } from "./lib/verifyRedisConnection";

async function bootstrap() {
  validateEnvVars();

  await connectWithRetry(); // Checks DB connection before starting server

  const redisAvailable = await verifyRedisConnection();

  if (!redisAvailable) {
    logger.warn({
      action: "REDIS_UNAVAILABLE_AT_BOOT",
      context: "BOOTSTRAP",
      message: "Revocation and caching will be disabled",
    });
  }

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    logger.info({
      action: "SERVER_STARTED",
      port: PORT,
      redisAvailable,
      context: "BOOTSTRAP",
    });
  });
}

bootstrap().catch((err) => {
  logger.fatal({
    action: "SERVER_BOOTSTRAP_FAILED",
    error: err instanceof Error ? err.message : String(err),
    context: "BOOTSTRAP",
  });
  process.exit(1);
});