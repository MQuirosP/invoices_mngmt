import { validateRealMime } from "@/shared/utils/file/validateRealMime";
import { CloudinaryService } from "./cloudinary.service";
import { generateRandomFilename } from "@/shared/utils/file/generateRandomFilename";
import { logger } from "@/shared/utils/logging/logger";
import { AppError } from "../utils/appError.utils";

export class AttachmentService {
  static async uploadValidated(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    invoiceId: string,
    userId: string
  ): Promise<{
    invoiceId: string;
    url: string;
    mimeType: string;
    fileName: string;
  }> {
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
    const { mime, ext } = await validateRealMime(buffer, mimetype);

    const filename = generateRandomFilename(mime, invoiceId);
    const result = await cloudinary.upload(buffer, filename, mime, userId);
    const url = result?.url;

    if (!url) {
      throw new AppError("Attachment upload failed", 500);
    }

    return {
      invoiceId,
      url,
      mimeType: mime,
      fileName: `${filename}.${ext}`,
    };
  }
}
