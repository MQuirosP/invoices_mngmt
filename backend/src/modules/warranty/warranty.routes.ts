import { Router } from "express";
import { create, findByInvoice, update, remove } from "./warranty.controller";
import { authenticate } from "@/modules/auth/auth.middleware";

const router = Router();

router.post("/", authenticate, create);
router.get("/:invoiceId", authenticate, findByInvoice);
router.put("/:invoiceId", authenticate, update);
router.delete("/:invoiceId", authenticate, remove);

export default router;
