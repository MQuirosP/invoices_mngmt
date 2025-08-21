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
router.get("/:id", authenticate, validateParams(["id"]) ,controller.get); // Get single invoice
router.get("/", authenticate, controller.list); // List invoices
router.delete(
  "/:id",
  authenticate,
  requireRole(["ADMIN"]),
  validateParams(["id"]),
  controller.remove
);
; // Delete invoice

// ====================
// Attachments
// ====================
router.get(
  "/:invoiceId/attachments/:attachmentId/download",
  authenticate,
  validateParams(["invoiceId", "attachmentId"]),
  controller.download
);

// ====================
// Import / OCR
// ====================
router.post("/ocrscan", authenticate, upload.single("file"), controller.importFromLocal); // From local file
router.patch(
  "/import/:invoiceId",
  authenticate,
  validateParams(["invoiceId"]),
  controller.importFromUrl
); // From URL
router.patch(
  "/extract/:invoiceId",
  authenticate,
  validateParams(["invoiceId"]),
  controller.importDataFromAttachment
); // From own attachment

// ====================
// Invoice creation
// ====================
router.post("/", authenticate, upload.array("files", 5), controller.create); // Create with optional files

export default router;
