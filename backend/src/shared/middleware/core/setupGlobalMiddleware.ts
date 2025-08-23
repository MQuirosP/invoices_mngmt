import express from "express";
import cors from "cors";
import { logger } from "@/shared/utils/logging/logger";

export function setupGlobalMiddleware(app: express.Express) {
  app.use(cors());
  app.use(express.json());

  logger.info({
    layer: "config",
    action: "GLOBAL_MIDDLEWARE_SETUP",
    timestamp: new Date().toISOString(),
  });
}