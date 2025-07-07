import express from "express";;
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import { errorHandler } from "./shared/middleware/errorHandler";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas principales
app.use("/api", routes);

// Manejo de errores
app.use(errorHandler);

export default app;