import { Router } from "express";
import { InvoiceController } from "modules/invoice/invoice.controller";
import { authenticate } from "@/modules/auth/auth.middleware";
import { upload } from "@/shared/middleware/upload";
import { validateParams } from "@/shared/middleware/validateParams";
import { requireRole } from "@/shared/middleware/requireRole";

const router = Router();
const controller = new InvoiceController();
// ====================
// Public invoice access
// ====================
router.get("/:id", authenticate, validateParams(["id"]) ,controller.get.bind(controller)); // Get single invoice
router.get("/", authenticate, controller.list); // List invoices
router.delete(
  "/:id",
  authenticate,
  requireRole(["ADMIN"]),
  validateParams(["id"]),
  controller.remove.bind(controller)
);
; // Delete invoice

// ====================
// Attachments
// ====================
router.get(
  "/:invoiceId/attachments/:attachmentId/download",
  authenticate,
  validateParams(["invoiceId", "attachmentId"]),
  controller.download.bind(controller)
);

// ====================
// Import / OCR
// ====================
router.post("/ocrscan", authenticate, upload.single("file"), controller.importFromLocal.bind(controller)); // From local file
router.patch(
  "/import/:invoiceId",
  authenticate,
  validateParams(["invoiceId"]),
  controller.importFromUrl.bind(controller)
); // From URL
router.patch(
  "/extract/:invoiceId",
  authenticate,
  validateParams(["invoiceId"]),
  controller.importDataFromAttachment.bind(controller)
); // From own attachment

// ====================
// Invoice creation
// ====================
router.post("/", authenticate, upload.array("files", 5), controller.create.bind(controller)); // Create with optional files

export default router;
