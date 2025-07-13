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
router.get("/", authenticate, list); //OK
router.get("/:id", authenticate, show); //OK

// Attachments
router.get("/:invoiceId/attachments/:attachmentId/download", authenticate, download); //OK
router.post("/:invoiceId/extract", authenticate, extractFromAttachment); //OK
router.post("/import/:invoiceId", authenticate, importFromUrl); //OK
router.post("/import/local", authenticate, upload.single("file"), importFromLocal); //OK

// Invoice creation
router.post("/", authenticate, upload.array("files", 5), create); //OK by user

// Delete invoice
router.delete("/:id", authenticate, remove);

export default router;
