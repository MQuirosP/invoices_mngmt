import { Router } from "express";
import { authenticate } from "@/modules/auth/auth.middleware";
import { validateParams } from "@/shared/validators/validateParams";
import { requireRole } from "@/shared/middleware/features/requireRole";
import { upload } from "@/shared/middleware/features/upload";
import { InvoiceController } from "@/modules/invoice";
import type { InvoiceControllerType } from "@/modules/invoice/invoice.controller";

const router = Router();
const invoiceController: InvoiceControllerType = InvoiceController;
// ====================
// Public invoice access
// ====================
router.get("/:id", authenticate, validateParams(["id"]), invoiceController.get);
router.get("/", authenticate, invoiceController.list);
router.delete(
  "/:id",
  authenticate,
  requireRole(["ADMIN"]),
  validateParams(["id"]),
  invoiceController.remove
);

// ====================
// Attachments
// ====================
router.get(
  "/:invoiceId/attachments/:attachmentId/download",
  authenticate,
  validateParams(["invoiceId", "attachmentId"]),
  invoiceController.download
);

// ====================
// Import / OCR
// ====================
router.post("/ocrscan", authenticate, upload.single("file"), invoiceController.importFromLocal);
router.patch(
  "/import/:invoiceId",
  authenticate,
  validateParams(["invoiceId"]),
  invoiceController.importFromUrl
);
router.patch(
  "/extract/:invoiceId",
  authenticate,
  validateParams(["invoiceId"]),
  invoiceController.importDataFromAttachment
);

// ====================
// Invoice creation
// ====================
router.post("/", authenticate, upload.array("files", 5), invoiceController.create);

export default router;

