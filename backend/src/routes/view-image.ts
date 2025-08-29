// routes/view-image.ts
import express from "express";
import { AuthRequest } from "@/modules/auth";
import { Response } from "express";
import { requireUserId } from "@/shared";
import { getInvoiceById } from "@/modules/invoice";
import { logger } from "@/shared/utils/logging/logger";
import axios from "axios";

const router = express.Router();

router.get("/:id", async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = requireUserId(req);

  try {
    const invoice = await getInvoiceById(id, userId);
    if (!invoice || invoice.userId !== userId) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const attachmentUrl = invoice.attachments?.[0]?.url;
    if (!attachmentUrl) {
      res.status(404).json({ error: "No attachment found" });
      return;
    }

    logger.info({
      layer: "route",
      action: "IMAGE_STREAM",
      invoiceId: id,
      userId,
      attachmentUrl,
      timestamp: new Date().toISOString(),
    });

    const imageResponse = await axios.get(attachmentUrl, {
      responseType: "stream",
    });
    res.setHeader("Content-Type", imageResponse.headers["content-type"]);
    imageResponse.data.pipe(res);
  } catch (err: unknown) {
    logger.error({
      layer: "route",
      action: "IMAGE_STREAM_ERROR",
      invoiceId: id,
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
