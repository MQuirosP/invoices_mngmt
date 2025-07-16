import { validateRealMime } from "@/shared/utils/validateRealMime";
import { CloudinaryService } from "./cloudinary.service";
import { generateRandomFilename } from "@/shared/utils/generateRandomFilename";
// import { mimeExtensionMap } from "../constants/mimeExtensionMap";
import { prisma } from "@/config/prisma";
import { logger } from "@/shared/utils/logger";

export class AttachmentService {
  static async uploadValidated(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    invoiceId: string,
    userId: string
  ) {
    const { buffer, mimetype, originalname } = file;

    // Validate real MIME from buffer
    const { mime, ext } = await validateRealMime(buffer, mimetype);

    // Random file name generate
    logger.info({originalname}, "Original file received");
    const filename = generateRandomFilename(mime);
    logger.info({filename, ext}, "Random filename generated");
    // Upload to cloudinary
    const cloudinary = new CloudinaryService();
    const { url } = await cloudinary.upload(buffer, filename, mime, userId);

    // Record attachment on DB
    const attachment = await prisma.attachment.create({
      data: {
        invoiceId,
        url,
        mimeType: mime,
        fileName: `${filename}.${ext}`,
      },
    });

    return attachment;
  }
}
