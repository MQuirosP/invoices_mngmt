import { Router } from "express";
import {
  create,
  download,
  list,
  remove,
  show,
  importFromLocal,
  importFromUrl,
  extractFromAttachment
} from "@/modules/invoice";
import { authenticate } from "@/modules/auth";
import { upload } from "@/shared/middleware/upload";

const router = Router();

// List & detail routes
router.get("/", authenticate, list);
router.get("/:id", authenticate, show);

// Attachments
router.get("/:invoiceId/attachments/:attachmentId/download", authenticate, download);
router.post("/:invoiceId/extract", authenticate, extractFromAttachment);

// Invoice creation
router.post("/", authenticate, upload.array("files", 5), create);
router.post("/import/local", authenticate, upload.single("file"), importFromLocal);
router.post("/import/:invoiceId", authenticate, importFromUrl);

// Delete invoice
router.delete("/:id", authenticate, remove);

export default router;
