import dotenv from "dotenv";
import { validateEnvVars } from "./validateEnv";
import { logger } from '@/shared/utils/logger';

export function setupEnv() {
  dotenv.config();
  validateEnvVars();
  logger.info({
    layer: "config",
    action: "ENV_LOADED",
    timestamp: new Date().toISOString(),
  })
}
