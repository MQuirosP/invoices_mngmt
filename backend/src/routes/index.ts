import { Router } from "express";
import authRouter from "../modules/auth/routes/auth.routes";
import invoiceRouter from "../modules/invoices/routes/invoice.routes";
import warrantyRouter from "../modules/warranties/routes/warranty.routes"

const router = Router();

// Ruta de prueba
router.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Modulo de autenticación
router.use("/auth", authRouter);
router.use("/invoices", invoiceRouter);
router.use("/warranties", warrantyRouter)

export default router;
