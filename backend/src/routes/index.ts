import { Router } from "express";
import authRouter from "@/modules/auth/auth.routes";
import invoiceRouter from "@/modules/invoice/invoice.routes";
import warrantyRouter from "@/modules/warranty/warranty.routes";

const router = Router();

// Fake endpoint for test
router.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Auth module
router.use("/auth", authRouter);
// Invoice module
router.use("/invoices", invoiceRouter);
// Warranty module
router.use("/warranties", warrantyRouter);

export default router;
