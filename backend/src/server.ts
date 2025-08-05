import { validateEnvVars } from "@/config/validateEnv";
import app from "./app";
import { logger } from "@/shared/utils/logger";
import { verifyRedisConnection } from "./lib/redis";

validateEnvVars();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  logger.info({ port: PORT }, "Server started");
  verifyRedisConnection();
});
