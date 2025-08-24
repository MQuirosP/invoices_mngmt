import { invoiceIncludeOptions } from "./../invoice.query";
import { prisma } from "@/config/prisma";
import {
  AppError,
  ImportService,
  AttachmentService,
  FileFetcherService,
  validateRealMime,
  mimeMetadataMap,
  ExtractedInvoiceMetadata,
} from "@/shared";
import { logger } from "@/shared/utils/logging/logger";

export class OCRService {
  constructor(private importService: ImportService) {}

  async createInvoiceFromBuffer(
    buffer: Buffer,
    userId: string,
    originalName: string,
    mimeType: string
  ) {
    logger.info({
      layer: "service",
      action: "OCR_CREATE_FROM_BUFFER_ATTEMPT",
      userId,
      fileName: originalName,
      mimeType,
    });

    const metadata: ExtractedInvoiceMetadata = await this.importService.extractAndRoute({
      buffer,
      declaredMime: mimeType,
      url: originalName,
    });

    logger.info({
      layer: "service",
      action: "OCR_METADATA_EXTRACTED",
      userId,
      source: "buffer",
      title: metadata.title,
      itemCount: metadata.items?.length ?? 0,
    });

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          userId,
          title: metadata.title,
          issueDate: metadata.issueDate,
          expiration: metadata.expiration,
          provider: metadata.provider,
          extracted: true,
        },
      });

      if (metadata.items?.length) {
        await tx.invoiceItem.createMany({
          data: metadata.items.map((item) => ({
            ...item,
            invoiceId: invoice.id,
          })),
        });
      }

      const attachmentData = await AttachmentService.uploadValidated(
        { buffer, mimetype: mimeType, originalname: originalName },
        invoice.id,
        userId
      );

      const attachment = await tx.attachment.create({
        data: attachmentData,
      });

      logger.info({
        layer: "service",
        action: "OCR_ATTACHMENT_PERSISTED",
        userId,
        invoiceId: invoice.id,
        attachmentId: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        url: attachment.url,
      });

      return invoice.id;
    });

    logger.info({
      layer: "service",
      action: "OCR_CREATE_FROM_BUFFER_SUCCESS",
      userId,
      invoiceId: result,
      itemCount: metadata.items?.length ?? 0,
    });

    return prisma.invoice.findUnique({
      where: { id: result },
      include: invoiceIncludeOptions,
    });
  }

  async updateInvoiceFromUrl(invoiceId: string, userId: string, url: string) {
    logger.info({
      layer: "service",
      action: "OCR_UPDATE_FROM_URL_ATTEMPT",
      userId,
      invoiceId,
      url,
    });

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { attachments: true, items: true },
    });

    if (!invoice) {
      logger.warn({
        layer: "service",
        action: "OCR_UPDATE_INVOICE_NOT_FOUND",
        userId,
        invoiceId,
      });
      throw new AppError("Invoice not found", 404);
    }

    const fetcher = new FileFetcherService();
    const buffer = await fetcher.fetchBuffer(url);

    const filename = url.split("/").pop()?.split("?")[0] || "unknown";
    const ext = filename.split(".").pop()?.toLowerCase();

    if (
      !ext ||
      !Object.values(mimeMetadataMap).some((meta) => meta.ext === ext)
    ) {
      throw new AppError(
        "Unsupported or missing file extension",
        415,
        true,
        undefined,
        {
          layer: "ocr",
          module: "ocr.service",
          reason: "EXTENSION_NOT_ALLOWED",
          filename,
          url,
        }
      );
    }

    const declaredMime = Object.entries(mimeMetadataMap).find(
      ([mime, meta]) => meta.ext === ext
    )?.[0]!;

    const { mime } = await validateRealMime(buffer, declaredMime, filename);

    const metadata = await this.importService.extractAndRoute({
      buffer,
      declaredMime: mime,
      url,
    });

    logger.info({
      layer: "service",
      action: "OCR_METADATA_EXTRACTED",
      userId,
      source: "url",
      invoiceId,
      title: metadata.title,
      itemCount: metadata.items?.length ?? 0,
    });

    await prisma.$transaction(async (tx) => {
      const existingAttachment = invoice.attachments.find((a) => a.url === url);
      if (!existingAttachment) {
        await tx.attachment.create({
          data: {
            invoiceId,
            url,
            fileName: "file_from_url",
            mimeType: "application/octet-stream",
          },
        });

        logger.info({
          layer: "service",
          action: "OCR_ATTACHMENT_CREATED_FROM_URL",
          userId,
          invoiceId,
          url,
        });
      }

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          title: metadata.title,
          issueDate: metadata.issueDate,
          expiration: metadata.expiration,
          provider: metadata.provider,
          extracted: true,
        },
      });

      await tx.invoiceItem.deleteMany({ where: { invoiceId } });

      if (metadata.items?.length) {
        await tx.invoiceItem.createMany({
          data: metadata.items.map((item) => ({ ...item, invoiceId })),
        });
      }
    });

    logger.info({
      layer: "service",
      action: "OCR_UPDATE_FROM_URL_SUCCESS",
      userId,
      invoiceId,
      itemCount: metadata.items?.length ?? 0,
    });

    return prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: invoiceIncludeOptions,
    });
  }
}
