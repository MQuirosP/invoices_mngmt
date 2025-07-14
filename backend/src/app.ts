import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import { errorHandler } from "./shared/middleware/errorHandler";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Main routes
app.use("/api", routes);

// Error handler
app.use(errorHandler);

export default app;
