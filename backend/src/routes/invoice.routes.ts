import { Router } from "express";
import { authenticate } from "@/modules/auth/auth.middleware";
import { validateParams } from "@/shared/middleware/core/validateParams";
import { requireRole } from "../shared/middleware/features/requireRole";
import { upload } from "../shared/middleware/features/upload";
import { InvoiceController } from "../modules/invoice";

const router = Router();
const invoiceController = InvoiceController;
// ====================
// Public invoice access
// ====================
router.get("/:id", authenticate, validateParams(["id"]), invoiceController.get); // Get single invoice
router.get("/", authenticate, invoiceController.list); // List invoices
router.delete(
  "/:id",
  authenticate,
  requireRole(["ADMIN"]),
  validateParams(["id"]),
  invoiceController.remove
);
; // Delete invoice

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
router.post("/ocrscan", authenticate, upload.single("file"), invoiceController.importFromLocal); // From local file
router.patch(
  "/import/:invoiceId",
  authenticate,
  validateParams(["invoiceId"]),
  invoiceController.importFromUrl
); // From URL
router.patch(
  "/extract/:invoiceId",
  authenticate,
  validateParams(["invoiceId"]),
  invoiceController.importDataFromAttachment
); // From own attachment

// ====================
// Invoice creation
// ====================
router.post("/", authenticate, upload.array("files", 5), invoiceController.create); // Create with optional files

export default router;
