import { prisma } from "@/config/prisma";
import { FileFetcherService } from "@/shared/services/fileFetcher.service";
import { CloudinaryService } from "@/shared/services/cloudinary.service";
import { OCRService } from "@/shared/services/ocr.service";
import { updateInvoiceFromMetadata } from "@/modules/invoice/invoice.service";

export class ImportService {
  private fetcher = new FileFetcherService();
  private cloudinary = new CloudinaryService();
  private ocr = new OCRService();

  async importFromUrl(url: string, userId: string) {
    const buffer = await this.fetcher.fetchBuffer(url);
    const metadata = await this.ocr.extractMetadataFromBuffer(buffer);
    const ext = url.split('.').pop()!.split('?')[0].toLowerCase();
    const uploadRes = await this.cloudinary.upload(buffer, metadata.title, `image/${ext}`);
    return prisma.invoice.create({
      data: {
        userId,
        title: metadata.title,
        issueDate: metadata.issueDate,
        expiration: metadata.expiration,
        provider: metadata.provider,
        extracted: true,
        attachments: { create: [{ url: uploadRes.url, mimeType: uploadRes.type, fileName: `${metadata.title}.${ext}` }] },
        warranty: metadata.duration ? { create: { duration: metadata.duration, validUntil: metadata.validUntil! } } : undefined,
      },
      include: { attachments: true, warranty: true },
    });
  }

  async updateFromUrl(url: string, invoiceId: string) {
    const buffer = await this.fetcher.fetchBuffer(url);
    const metadata = await this.ocr.extractMetadataFromBuffer(buffer);
    return updateInvoiceFromMetadata(invoiceId, metadata);
  }

  async importFromBuffer(buffer: Buffer, userId: string, originalName: string, mimeType: string) {
    const metadata = await this.ocr.extractMetadataFromBuffer(buffer);
    const ext = originalName.split('.').pop()!.toLowerCase();
    const uploadRes = await this.cloudinary.upload(buffer, metadata.title, mimeType);
    return prisma.invoice.create({
      data: {
        userId,
        title: metadata.title,
        issueDate: metadata.issueDate,
        expiration: metadata.expiration,
        provider: metadata.provider,
        extracted: true,
        attachments: { create: [{ url: uploadRes.url, mimeType: uploadRes.type, fileName: `${metadata.title}.${ext}` }] },
        warranty: metadata.duration ? { create: { duration: metadata.duration, validUntil: metadata.validUntil! } } : undefined,
      },
      include: { attachments: true, warranty: true },
    });
  }
}
