import { Router } from "express";
import { create, list } from "../controller/invoice.controller";
import { authenticate } from "../../auth/middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, create);
router.get("/", authenticate, list);

export default router;
