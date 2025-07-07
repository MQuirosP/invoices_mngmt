import { Router } from "express";
import authRouter from "../modules/auth/routes/auth.routes";

const router = Router();

// Ruta de prueba
router.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Modulo de autenticación
router.use("/auth", authRouter);

export default router;