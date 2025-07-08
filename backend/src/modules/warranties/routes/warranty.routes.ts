import { Router } from "express";
import {
  create,
  findByInvoice,
  update,
  remove,
} from "../controller/warranty.controller";
import { authenticate } from "../../auth/middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, create);
router.get("/:invoiceId", authenticate, findByInvoice);
router.put("/:invoiceId", authenticate, update);
router.delete("/:invoiceId", authenticate, remove);

export default router;
