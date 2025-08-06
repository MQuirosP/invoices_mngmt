import { validateRealMime } from "@/shared/utils/file/validateRealMime";
import { CloudinaryService } from "./cloudinary.service";
import { generateRandomFilename } from "@/shared/utils/file/generateRandomFilename";
import { prisma } from "@/config/prisma";
import { logger } from "@/shared/utils/logger";
import { AppError } from "../utils/AppError.utils";

export class AttachmentService {
  private cloudinary: CloudinaryService;

  constructor() {
    this.cloudinary = new CloudinaryService();
  }

  async uploadValidated(
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

    const { buffer, mimetype } = file;

    // Validate real MIME from buffer
    const { mime, ext } = await validateRealMime(buffer, mimetype);
    logger.info({
      action: "ATTACHMENT_MIME_VALIDATED",
      context: "ATTACHMENT_SERVICE",
      originalMime: mimetype,
      validatedMime: mime,
      extension: ext,
    });

    // Generate random filename
    const filename = generateRandomFilename(mime, invoiceId);
    logger.info({
      invoiceId,
      userId,
      filename,
      ext,
      action: "ATTACHMENT_FILENAME_GENERATED",
    });

    // Upload to Cloudinary
    let url: string;
    try {
      const result = await this.cloudinary.upload(buffer, filename, mime, userId);
      url = result.url;
    } catch (error: any) {
      logger.error({
        action: "ATTACHMENT_UPLOAD_ERROR",
        context: "ATTACHMENT_SERVICE",
        error,
        invoiceId,
        userId,
        filename,
        mime,
      });
      throw new AppError("Cloudinary upload failed", 500);
    }

    if (!url) {
      logger.warn({
        invoiceId,
        fileName: file.originalname,
        action: "ATTACHMENT_UPLOAD_FAILED",
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
      action: "ATTACHMENT_UPLOAD_SUCCESS",
      context: "ATTACHMENT_SERVICE",
      invoiceId,
      userId,
      attachmentId: attachment.id,
      fileName: attachment.fileName,
    });

    return attachment;
  }
}