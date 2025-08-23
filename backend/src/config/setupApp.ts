import express from "express";
import { setupGlobalMiddleware } from "@/shared/middleware/core/setupGlobalMiddleware";
import routes from "@/routes";
import { errorHandler } from "@/shared/middleware/core/errorHandler";
import { logger } from "@/shared/utils/logging/logger";

export function setupApp(): express.Express {
  const app = express();

  // Setup global middleware
  setupGlobalMiddleware(app);

  // Main routes
  app.use("/api", routes);

  // Error handler
  app.use(errorHandler);

  logger.info({
    layer: "config",
    action: "APP_SETUP_COMPLETE",
    timestamp: new Date().toISOString(),
  });

  return app;
}