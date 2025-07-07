import { Router } from "express";
import { create, list, remove, show } from "../controller/invoice.controller";
import { authenticate } from "../../auth/middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, create);
router.get("/", authenticate, list);
router.get("/:id", authenticate, show);
router.delete("/:id", authenticate, remove)

export default router;
