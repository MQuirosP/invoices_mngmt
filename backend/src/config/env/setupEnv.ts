import dotenv from "dotenv";
import { logger } from '@/shared/utils/logging/logger';
import { validateEnvVars } from "./validateEnv";

export function setupEnv() {
  dotenv.config();
  validateEnvVars();
  logger.info({
    layer: "config",
    action: "ENV_LOADED",
    timestamp: new Date().toISOString(),
  })
}
