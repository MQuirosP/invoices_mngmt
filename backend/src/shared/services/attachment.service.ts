import { validateRealMime } from "@/shared/utils/validateRealMime";
import { CloudinaryService } from "./cloudinary.service";
import { generateRandomFilename } from "@/shared/utils/generateRandomFilename";
import { prisma } from "@/config/prisma";
import { logger } from "@/shared/utils/logger";

export class AttachmentService {
  static async uploadValidated(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    invoiceId: string,
    userId: string
  ) {
    logger.info({
      userId,
      invoiceId,
      fileName: file.originalname,
      mimetype: file.mimetype,
      action: "ATTACHMENT_UPLOAD_ATTEMPT",
    });
    const { buffer, mimetype, originalname } = file;

    // Validate real MIME from buffer
    const { mime, ext } = await validateRealMime(buffer, mimetype);

    // Random file name generate
    logger.info({originalname}, "Original file received");
    const filename = generateRandomFilename(mime, invoiceId);
    logger.info({filename, ext}, "Random filename generated");
    // Upload to cloudinary
    const cloudinary = new CloudinaryService();
    const { url } = await cloudinary.upload(buffer, filename, mime, userId);

    if (!url) {
      logger.warn({ invoiceId, fileName: file.originalname, action: "ATTACHMENT_UPLOAD_FAILED" });
      throw new Error("Attachment upload failed");
    }

    // Record attachment on DB
    const attachment = await prisma.attachment.create({
      data: {
        invoiceId,
        url,
        mimeType: mime,
        fileName: `${filename}.${ext}`,
      },
    });
    logger.info({ invoiceId, fileName: file.originalname, action: "ATTACHMENT_UPLOAD_SUCCESS" });
    return attachment;
  }
}
