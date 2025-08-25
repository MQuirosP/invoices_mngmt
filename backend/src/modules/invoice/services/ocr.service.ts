import {
  ImportService,
  FileFetcherService,
  validateRealMime,
  mimeMetadataMap,
  AppError,
} from "@/shared";
import { prisma } from "@/config/prisma";
import { invoiceIncludeOptions } from "../invoice.query";
import { logger } from "@/shared/utils/logging/logger";
import { createInvoice, updateInvoiceFromMetadata } from "..";

export class OCRService {
  constructor(
    private importService: ImportService
  ) {}

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

    const metadata = await this.importService.extractAndRoute({
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

    const invoice = await createInvoice(
      userId,
      metadata,
      {
        buffer,
        mimetype: mimeType,
        originalname: originalName,
      } as Express.Multer.File
    );

    logger.info({
      layer: "service",
      action: "OCR_CREATE_FROM_BUFFER_SUCCESS",
      userId,
        invoiceId: invoice.invoiceId,
      itemCount: metadata.items?.length ?? 0,
    });

    return prisma.invoice.findUnique({
      where: { id: invoice.invoiceId },
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

    if (!ext || !Object.values(mimeMetadataMap).some((meta) => meta.ext === ext)) {
      throw new AppError("Unsupported or missing file extension", 415, true, undefined, {
        layer: "ocr",
        module: "ocr.service",
        reason: "EXTENSION_NOT_ALLOWED",
        filename,
        url,
      });
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

    await updateInvoiceFromMetadata(invoiceId, userId, metadata, url);

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