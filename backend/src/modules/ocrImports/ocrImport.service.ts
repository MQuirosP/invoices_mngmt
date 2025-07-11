import { prisma } from "@/config/prisma";
import { OCRService } from "@/shared/services/ocr.service";
import axios from "axios";
import { updateInvoiceFromMetadata } from "@/modules/invoices/invoice.service";
import { uploadToCloudinary } from "../../shared";

export class ImportService {
  async importFromCloudinaryUrl(url: string, userId: string) {
    const buffer = Buffer.from(
      (await axios.get(url, { responseType: "arraybuffer" })).data
    );

    const metadata = await OCRService.extractMetadataFromBuffer(buffer);

    const extParts = url.split(".");
    const ext =
      extParts.length > 1 ? extParts.pop()!.split("?")[0].toLowerCase() : "";

    const newInvoice = await prisma.invoice.create({
      data: {
        userId,
        title: metadata.title,
        issueDate: metadata.issueDate,
        expiration: metadata.expiration ?? new Date(),
        provider: metadata.provider ?? "Desconocido",
        extracted: true,
        attachments: {
          create: [
            {
              url,
              mimeType: ext.toUpperCase(),
              fileName: `${metadata.title}.${ext}`,
            },
          ],
        },
        warranty: metadata.duration
          ? {
              create: {
                duration: metadata.duration,
                validUntil: new Date(
                  metadata.issueDate.getTime() + metadata.duration * 86400000
                ),
              },
            }
          : undefined,
      },
      include: { attachments: true, warranty: true },
    });

    return newInvoice;
  }

  async updateInvoiceFromCloudinaryUrl(url: string, invoiceId: string) {
    const buffer = Buffer.from(
      (await axios.get(url, { responseType: "arraybuffer" })).data
    );

    const metadata = await OCRService.extractMetadataFromBuffer(buffer);

    const updatedInvoice = await updateInvoiceFromMetadata(invoiceId, metadata);

    return updatedInvoice;
  }

  async importFromLocalFile(
    buffer: Buffer,
    userId: string,
    originalName: string,
    mimeType: string
  ) {
    const metadata = await OCRService.extractMetadataFromBuffer(buffer);

    const extParts = originalName.split(".");
    const ext = extParts.length > 1 ? extParts.pop()!.toLowerCase() : "";

    const { url, type } = await uploadToCloudinary(buffer, originalName, mimeType);
    
    const newInvoice = await prisma.invoice.create({
      data: {
        userId,
        title: metadata.title,
        issueDate: metadata.issueDate,
        expiration: metadata.expiration ?? new Date(),
        provider: metadata.provider ?? "Desconocido",
        extracted: true,
        attachments: {
          create: [
            {
              url,
              mimeType: type,
              fileName: `${metadata.title}.${ext}`,
            },
          ],
        },
        warranty: metadata.duration
          ? {
              create: {
                duration: metadata.duration,
                validUntil: new Date(
                  metadata.issueDate.getTime() + metadata.duration * 86400000
                ),
              },
            }
          : undefined,
      },
      include: { attachments: true, warranty: true },
    });

    return newInvoice;
  }
}
