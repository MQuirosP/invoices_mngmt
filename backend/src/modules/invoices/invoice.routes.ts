import { Router } from "express";
import { create, download, list, remove, show } from "@/modules/invoices";
import { authenticate } from "@/modules/auth";
import { upload } from "@/shared/middleware/upload";
import { importFromLocal, importFromUrl } from "@/modules/ocrImports";
import { extractFromAttachment } from "@/modules/invoices/invoice.controller";

const router = Router();

// router.post("/", authenticate, create);
router.get("/", authenticate, list);
router.get("/:id", authenticate, show);
router.delete("/:id", authenticate, remove);

// Route for upload files
router.post("/", authenticate, upload.array("files", 5), create);
router.post("/import/local", authenticate, upload.single("file"), importFromLocal);

// Route to downloadn invoice
router.get(
  "/:invoiceId/attachments/:attachmentId/download",
  authenticate,
  download
);

router.post("/import", authenticate, (req, res, next) => {
  Promise.resolve(importFromUrl(req, res)).catch(next);
});

router.post("/:invoiceId/extract", authenticate, extractFromAttachment);

export default router;
