import { validateRealMime } from "@/shared/utils/file/validateRealMime";
import { CloudinaryService } from "./cloudinary.service";
import { generateRandomFilename } from "@/shared/utils/file/generateRandomFilename";
import { prisma } from "@/config/prisma";
import { logger } from "@/shared/utils/logging/logger";
import { AppError } from "../utils/appError.utils";

export class AttachmentService {
  static async uploadValidated(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    invoiceId: string,
    userId: string
  ) {
    const cloudinary = new CloudinaryService();

    logger.info({
      layer: "service",
      module: "attachment",
      action: "ATTACHMENT_UPLOAD_ATTEMPT",
      userId,
      invoiceId,
      fileName: file.originalname,
      mimetype: file.mimetype,
      timestamp: new Date().toISOString(),
    });

    const { buffer, mimetype } = file;

    // Validate real MIME from buffer
    const { mime, ext } = await validateRealMime(buffer, mimetype);
    logger.info({
      layer: "service",
      module: "attachment",
      action: "ATTACHMENT_MIME_VALIDATED",
      originalMime: mimetype,
      validatedMime: mime,
      extension: ext,
      timestamp: new Date().toISOString(),
    });

    // Generate random filename
    const filename = generateRandomFilename(mime, invoiceId);
    logger.info({
      layer: "service",
      module: "attachment",
      action: "ATTACHMENT_FILENAME_GENERATED",
      invoiceId,
      userId,
      filename,
      ext,
      timestamp: new Date().toISOString(),
    });

    // Upload to Cloudinary
    let url: string;
    try {
      const result = await cloudinary.upload(buffer, filename, mime, userId);
      url = result.url;
    } catch (error: any) {
      logger.error({
        layer: "service",
        module: "attachment",
        action: "ATTACHMENT_UPLOAD_ERROR",
        reason: "CLOUDINARY_UPLOAD_FAILED",
        error: error instanceof Error ? error.message : String(error),
        invoiceId,
        userId,
        filename,
        mime,
        timestamp: new Date().toISOString(),
      });
      throw new AppError("Cloudinary upload failed", 500);
    }

    if (!url) {
      logger.warn({
        layer: "service",
        module: "attachment",
        action: "ATTACHMENT_UPLOAD_FAILED",
        reason: "NO_URL_RETURNED",
        invoiceId,
        fileName: file.originalname,
        timestamp: new Date().toISOString(),
      });
      throw new AppError("Attachment upload failed", 500);
    }

    // Record attachment in DB
    const attachment = await prisma.attachment.create({
      data: {
        invoiceId,
        url,
        mimeType: mime,
        fileName: `${filename}.${ext}`,
      },
    });

    logger.info({
      layer: "service",
      module: "attachment",
      action: "ATTACHMENT_UPLOAD_SUCCESS",
      invoiceId,
      userId,
      attachmentId: attachment.id,
      fileName: attachment.fileName,
      timestamp: new Date().toISOString(),
    });

    return attachment;
  }
}
