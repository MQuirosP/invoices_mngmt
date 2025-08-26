import { Router } from "express";
import { authenticate } from "@/modules/auth/auth.middleware";
import { validateParams } from "@/shared/middleware/core/validateParams";
import { requireRole } from "../shared/middleware/features/requireRole";
import { upload } from "../shared/middleware/features/upload";
import { get, list, remove, download, importFromLocal, importFromUrl, importDataFromAttachment, create } from "../modules/invoice";

const router = Router();
// ====================
// Public invoice access
// ====================
router.get("/:id", authenticate, validateParams(["id"]), get); // Get single invoice
router.get("/", authenticate, list); // List invoices
router.delete(
  "/:id",
  authenticate,
  requireRole(["ADMIN"]),
  validateParams(["id"]),
  remove
);
; // Delete invoice

// ====================
// Attachments
// ====================
router.get(
  "/:invoiceId/attachments/:attachmentId/download",
  authenticate,
  validateParams(["invoiceId", "attachmentId"]),
  download
);

// ====================
// Import / OCR
// ====================
router.post("/ocrscan", authenticate, upload.single("file"), importFromLocal); // From local file
router.patch(
  "/import/:invoiceId",
  authenticate,
  validateParams(["invoiceId"]),
  importFromUrl
); // From URL
router.patch(
  "/extract/:invoiceId",
  authenticate,
  validateParams(["invoiceId"]),
  importDataFromAttachment
); // From own attachment

// ====================
// Invoice creation
// ====================
router.post("/", authenticate, upload.array("files", 5), create); // Create with optional files

export default router;
