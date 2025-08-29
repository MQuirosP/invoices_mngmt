// routes/view-image.ts
import express from "express";
import { AuthRequest } from "@/modules/auth";
import { Response } from "express";
import { requireUserId } from "@/shared";
import { getSignedImageUrl } from "@/shared/utils/image-access";
import { getInvoiceById } from "@/modules/invoice";
import { logger } from "@/shared/utils/logging/logger";
import axios from "axios";

const router = express.Router();

router.get("/:invoiceId", async (req: AuthRequest, res: Response) => {
  const { invoiceId } = req.params;
  const userId = requireUserId(req);

  try {
    const invoice = await getInvoiceById(invoiceId, userId);
    if (!invoice || invoice.userId !== userId) {
      res.status(403).json({ error: "Unauthorized" });
      return;
    }

    const attachmentId = invoice.attachments?.[0]?.id;
    if (!attachmentId) {
      res.status(404).json({ error: "No attachment found" });
      return;
    }

    const signedUrl = await getSignedImageUrl(attachmentId);
    if (!signedUrl) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    logger.info({
      layer: "route",
      action: "IMAGE_STREAM",
      invoiceId,
      userId,
      attachmentId,
      timestamp: new Date().toISOString(),
    });

    const imageResponse = await axios.get(signedUrl, { responseType: "stream" });
    res.setHeader("Content-Type", imageResponse.headers["content-type"]);
    imageResponse.data.pipe(res);
  } catch (err: unknown) {
    logger.error({
      layer: "route",
      action: "IMAGE_STREAM_ERROR",
      invoiceId,
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;