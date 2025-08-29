import express from "express";
import { AuthRequest } from "@/modules/auth";
import { Response } from "express";
import { requireUserId } from "@/shared";
import { getSignedImageUrl } from "@/shared/utils/image-access";
import { getInvoiceById } from "@/modules/invoice";
import { logger } from "@/shared/utils/logging/logger";

const router = express.Router();

async function handleViewImage(req: AuthRequest, res: Response): Promise<void> {
  const { invoiceId } = req.params;
  const userId = requireUserId(req);

  try {
    const invoice = await getInvoiceById(invoiceId, userId);
    if (!invoice || invoice.userId !== userId) {
      res.status(403).json({ error: "Unauthorized" });
    }

    const attachmentId = invoice.attachments?.[0]?.id;
    if (!attachmentId) {
      res.status(404).json({ error: "No attachment found" });
    }

    const signedUrl = await getSignedImageUrl(attachmentId);
    if (!signedUrl) {
      res.status(404).json({ error: "Image not found" });
    }

    logger.info({
      layer: "route",
      action: "IMAGE_REDIRECT",
      invoiceId,
      userId,
      attachmentId,
      timestamp: new Date().toISOString(),
    });

    res.redirect(signedUrl!);
  } catch (err: unknown) {
    logger.error({
      layer: "route",
      action: "IMAGE_REDIRECT_ERROR",
      invoiceId,
      error: (err as Error).message,
    });
    res.status(500).json({ error: "Internal server error" });
  }
}

router.get("/view-image/:invoiceId", handleViewImage);

export default router;