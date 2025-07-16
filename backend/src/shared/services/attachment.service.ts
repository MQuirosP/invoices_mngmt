import { validateRealMime } from "@/shared/utils/validateRealMime";
import { CloudinaryService } from "./cloudinary.service";
import { generateRandomFilename } from "../utils/generateRandomFilename";
// import { mimeExtensionMap } from "../constants/mimeExtensionMap";
import { prisma } from "@/config/prisma";

export class AttachmentService {
  static async uploadValidated(file: Express.Multer.File, invoiceId: string, userId: string) {
    const { mime, ext } = await validateRealMime(file.buffer, file.mimetype);
    const filename = generateRandomFilename(mime);
    const cloudinary = new CloudinaryService();
    const { url } = await cloudinary.upload(file.buffer, filename, mime, userId);

    return prisma.attachment.create({
      data: {
        invoiceId,
        url,
        mimeType: mime,
        fileName: `${filename}.${ext}`,
      },
    });
  }
}
