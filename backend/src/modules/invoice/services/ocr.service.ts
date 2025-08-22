import { invoiceIncludeOptions } from './../invoice.query';
import { prisma } from "@/config/prisma";
import { AppError, ImportService, AttachmentService } from "@/shared";
import { logger } from "@/shared/utils/logger";

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

    const metadata = await this.importService.extractFromBuffer(buffer);

    logger.info({
      layer: "service",
      action: "OCR_METADATA_EXTRACTED",
      userId,
      source: "buffer",
      title: metadata.title,
      itemCount: metadata.items?.length ?? 0,
    });

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        title: metadata.title,
        issueDate: metadata.issueDate,
        expiration: metadata.expiration,
        provider: metadata.provider,
        extracted: true,
      },
      include: { attachments: true, items: true },
    });

    if (metadata.items?.length) {
      await prisma.invoiceItem.createMany({
        data: metadata.items.map((item) => ({ ...item, invoiceId: invoice.id })),
      });
    }

    await AttachmentService.uploadValidated(
      { buffer, mimetype: mimeType, originalname: originalName },
      invoice.id,
      userId
    );

    logger.info({
      layer: "service",
      action: "OCR_CREATE_FROM_BUFFER_SUCCESS",
      userId,
      invoiceId: invoice.id,
      itemCount: metadata.items?.length ?? 0,
    });

    return prisma.invoice.findUnique({
      where: { id: invoice.id },
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

    const metadata = await this.importService.extractFromUrl(url);

    logger.info({
      layer: "service",
      action: "OCR_METADATA_EXTRACTED",
      userId,
      source: "url",
      invoiceId,
      title: metadata.title,
      itemCount: metadata.items?.length ?? 0,
    });

    const existingAttachment = invoice.attachments.find((a) => a.url === url);
    if (!existingAttachment) {
      await prisma.attachment.create({
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

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        title: metadata.title,
        issueDate: metadata.issueDate,
        expiration: metadata.expiration,
        provider: metadata.provider,
        extracted: true,
      },
    });

    await prisma.invoiceItem.deleteMany({ where: { invoiceId } });
    if (metadata.items?.length) {
      await prisma.invoiceItem.createMany({
        data: metadata.items.map((item) => ({ ...item, invoiceId })),
      });
    }

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