import { prisma } from "@/config/prisma";
import { FileFetcherService } from "@/shared/services/fileFetcher.service";
import {
  CloudinaryService,
} from "@/shared/services/cloudinary.service";
import { OCRService } from "@/shared/services/ocr.service";
import { updateInvoiceFromMetadata } from "@/modules/invoice/invoice.service";
import { mimeExtensionMap } from "@/shared/constants/mimeExtensionMap";
import { getFileExtensionFromUrl } from "@/shared/utils/getFileExtensionFromUrl";

export class ImportService {
  private fetcher = new FileFetcherService();
  private cloudinary = new CloudinaryService();
  private ocr = new OCRService();

  async importFromUrl(url: string, userId: string) {
    const buffer = await this.fetcher.fetchBuffer(url);
    const metadata = await this.ocr.extractMetadataFromBuffer(buffer);
    const ext = getFileExtensionFromUrl(url) || "bin";
    const uploadRes = await this.cloudinary.upload(
      buffer,
      metadata.title,
      `image/${ext}`
    );
    return prisma.invoice.create({
      data: {
        userId,
        title: metadata.title,
        issueDate: metadata.issueDate,
        expiration: metadata.expiration,
        provider: metadata.provider,
        extracted: true,
        attachments: {
          create: [
            {
              url: uploadRes.url,
              mimeType: uploadRes.type,
              fileName: `${metadata.title}.${ext}`,
            },
          ],
        },
        warranty: metadata.duration
          ? {
              create: {
                duration: metadata.duration,
                validUntil: metadata.validUntil!,
              },
            }
          : undefined,
      },
      include: { attachments: true, warranty: true },
    });
  }

  async updateFromUrl(url: string, invoiceId: string, userId: string) {
    const buffer = await this.fetcher.fetchBuffer(url);
    const metadata = await this.ocr.extractMetadataFromBuffer(buffer);

    let ext = getFileExtensionFromUrl(url);

    if (!ext || !Object.values(mimeExtensionMap).includes(ext)) {
      if (metadata.mimeType && mimeExtensionMap[metadata.mimeType]) {
        ext = mimeExtensionMap[metadata.mimeType];
      } else {
        ext = "dat";
      }
    }

    const mimeTypeEntry = Object.entries(mimeExtensionMap).find(
      ([, extension]) => extension === ext
    );
    const mimeType = mimeTypeEntry ? mimeTypeEntry[0] : "application/octet-stream";

    const fileName = metadata.title ? `${metadata.title}.${ext}` : `attachment.${ext}`;

    const existingAttachment = await prisma.attachment.findFirst({
      where: { invoiceId, url },
    });

    if (!existingAttachment) {
      await prisma.attachment.create({
        data: {
          invoiceId,
          url,
          fileName,
          mimeType,
        },
      });

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { updatedAt: new Date() },
      });
    }

    return updateInvoiceFromMetadata(invoiceId, metadata);
  }

  async importFromBuffer(
    buffer: Buffer,
    userId: string,
    originalName: string,
    mimeType: string
  ) {
    const metadata = await this.ocr.extractMetadataFromBuffer(buffer);
    const ext = getFileExtensionFromUrl(originalName) || "bin";
    const uploadRes = await this.cloudinary.upload(
      buffer,
      metadata.title,
      mimeType
    );
    return prisma.invoice.create({
      data: {
        userId,
        title: metadata.title,
        issueDate: metadata.issueDate,
        expiration: metadata.expiration,
        provider: metadata.provider,
        extracted: true,
        attachments: {
          create: [
            {
              url: uploadRes.url,
              mimeType: uploadRes.type,
              fileName: `${metadata.title}.${ext}`,
            },
          ],
        },
        warranty: metadata.duration
          ? {
              create: {
                duration: metadata.duration,
                validUntil: metadata.validUntil!,
              },
            }
          : undefined,
      },
      include: { attachments: true, warranty: true },
    });
  }
}
