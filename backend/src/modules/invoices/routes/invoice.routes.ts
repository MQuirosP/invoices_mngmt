import { Router } from "express";
import { create, download, list, remove, show } from "../controller/invoice.controller";
import { authenticate } from "../../auth/middleware/auth.middleware";
import { upload } from "../../../shared/middleware/upload";

const router = Router();

// router.post("/", authenticate, create);
router.get("/", authenticate, list);
router.get("/:id", authenticate, show);
router.delete("/:id", authenticate, remove)

// Route for upload files
router.post("/", authenticate, upload.array("files", 5), create);

// Route to downloadn invoice
router.get("/:id/download", authenticate, download);

export default router;
