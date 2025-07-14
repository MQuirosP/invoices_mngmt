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
import { authenticate } from "@/modules/auth";
import { upload } from "@/shared/middleware/upload";

const router = Router();
// ====================
// Public invoice access
// ====================
router.get("/", authenticate, list);                 // List invoices
router.get("/:id", authenticate, show);              // Get single invoice
router.delete("/:id", authenticate, remove);         // Delete invoice

// ====================
// Attachments
// ====================
router.get("/:invoiceId/attachments/:attachmentId/download", authenticate, download);

// ====================
// Import / OCR
// ====================
router.post("/ocrscan", authenticate, upload.single("file"), importFromLocal);         // From local file
router.post("/import/:invoiceId", authenticate, importFromUrl);                        // From URL
router.post("/extract/:invoiceId", authenticate, importDataFromAttachment);            // From own attachment

// ====================
// Invoice creation
// ====================
router.post("/", authenticate, upload.array("files", 5), create);  // Create with optional files

export default router;
