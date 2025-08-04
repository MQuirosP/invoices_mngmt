import { Router } from "express";
import {
  create,
  download,
  list,
  remove,
  show,
  importFromLocal,
  importFromUrl,
  importDataFromAttachment,
} from "@/modules/invoice";
import { authenticate } from "@/modules/auth/auth.middleware";
import { upload } from "@/shared/middleware/upload";
import { validateParams } from "@/shared/middleware/validateParams";
import { requireRole } from "@/shared/middleware/requireRole";

const router = Router();
// ====================
// Public invoice access
// ====================
router.get("/:id", authenticate, validateParams(["id"]) , show); // Get single invoice
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
router.post(
  "/import/:invoiceId",
  authenticate,
  validateParams(["invoiceId"]),
  importFromUrl
); // From URL
router.post(
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
