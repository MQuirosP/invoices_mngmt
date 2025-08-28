import express from "express";
import { setupGlobalMiddleware } from "@/shared/middleware/core/setupGlobalMiddleware";
import routes from "@/routes";
import { errorHandler } from "@/shared/middleware/core/errorHandler";
import { logger } from "@/shared/utils/logging/logger";
import path from "path";
import fs from "fs";

export function setupApp(): express.Express {
  const app = express();

  const credsPath = path.join(__dirname, "gcp-creds.json");
  if (process.env.GCP_CREDENTIALS_JSON) {
    fs.writeFileSync(credsPath, process.env.GCP_CREDENTIALS_JSON);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
  }

  app.use(express.static(path.join(__dirname, "../../frontend")));
  app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend/index.html"));
  });

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
