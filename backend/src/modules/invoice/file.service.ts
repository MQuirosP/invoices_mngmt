import { prisma } from "@/config/prisma";
import { CloudinaryService } from "@/shared/services/cloudinary.service";
import { AppError } from "@/shared/utils/AppError";
import axios from "axios";
import { getFileExtension } from "@/shared/utils/file/getFileExtension";

const cloudinaryService = new CloudinaryService();

export class FileService {
  async uploadFiles(userId: string, invoiceId: string, files: Express.Multer.File[]) {
    const uploads: { secure_url: string; original_filename: string; format: string }[] = [];

    for (const file of files) {
      const result = await cloudinaryService.upload(file.buffer, file.originalname, file.mimetype, userId);
      await prisma.attachment.create({
        data: {
          invoiceId,
          url: result.url,
          fileName: result.type,
          mimeType: file.mimetype,
        },
      });
      uploads.push({
        secure_url: result.url,
        original_filename: file.originalname,
        format: file.mimetype,
      });
    }

    return uploads;
  }

  async downloadAttachment(userId: string, invoiceId: string, attachmentId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { attachments: true },
    });

    if (!invoice) throw new AppError("Invoice not found", 404);

    const attachment = invoice.attachments.find((a) => a.id === attachmentId);
    if (!attachment) throw new AppError("Attachment not found", 404);

    const response = await axios.get(attachment.url, { responseType: "stream" });
    const ext = getFileExtension(attachment.url) || "bin";
    const fileName = `${invoice.title.replace(/\s+/g, "_")}.${ext}`;

    return {
      stream: response.data,
      mimeType: response.headers["content-type"],
      fileName,
    };
  }
}
