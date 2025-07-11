import { prisma } from "@/config/prisma";
import { OCRService } from "@/shared/services/ocr.service";
import axios from "axios";
import { updateInvoiceFromMetadata } from "@/modules/invoices/invoice.service";

export class ImportService {
  async importFromCloudinaryUrl(url: string, userId: string) {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    const metadata = await OCRService.extractMetadataFromBuffer(buffer);

    const extParts = url.split(".");
    const ext = extParts.length > 1 ? extParts.pop()!.split("?")[0].toLowerCase() : "";

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
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    const metadata = await OCRService.extractMetadataFromBuffer(buffer);

    const updatedInvoice = await updateInvoiceFromMetadata(invoiceId, metadata);

    return updatedInvoice;
  }
}