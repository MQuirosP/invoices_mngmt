import { AppError, ImportService, prepareBufferForExtraction } from "@/shared";
import { logger } from "@/shared/utils/logging/logger";
import { InvoiceService } from "./core.service";
import { InvoiceRepository } from "../invoice.repository";

const invoiceRepo = InvoiceRepository;
const invoiceService = InvoiceService;

export const InvoiceOcrService = {
  createInvoiceFromBuffer: async (
    buffer: Buffer,
    userId: string,
    originalName: string,
    mimeType: string
  ) => {
    logger.info({
      layer: "service",
      action: "OCR_CREATE_FROM_BUFFER_ATTEMPT",
      userId,
      fileName: originalName,
      mimeType,
    });

    const metadata = await new ImportService().extractAndRoute({
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

    const invoice = await invoiceService.createInvoice(userId, metadata, {
      buffer,
      mimetype: mimeType,
      originalname: originalName,
    } as Express.Multer.File);

    logger.info({
      layer: "service",
      action: "OCR_CREATE_FROM_BUFFER_SUCCESS",
      userId,
      invoiceId: invoice.invoiceId,
      itemCount: metadata.items?.length ?? 0,
    });

    return invoiceRepo.findById(invoice.invoiceId);
  },

  updateInvoiceFromUrl: async (
    invoiceId: string,
    userId: string,
    url: string
  ) => {
    logger.info({
      layer: "service",
      action: "OCR_UPDATE_FROM_URL_ATTEMPT",
      userId,
      invoiceId,
      url,
    });

    const invoice = await invoiceService.getInvoiceById(invoiceId, userId);

    if (!invoice) {
      logger.warn({
        layer: "service",
        action: "OCR_UPDATE_INVOICE_NOT_FOUND",
        userId,
        invoiceId,
      });
      throw new AppError("Invoice not found", 404);
    }

    const { buffer, declaredMime, validatedMime, filename } =
      await prepareBufferForExtraction(url);

    const metadata = await new ImportService().extractAndRoute({
      buffer,
      declaredMime: validatedMime,
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
      filename,
      declaredMime,
      validatedMime,
    });

    await invoiceService.updateInvoiceFromMetadata(
      invoiceId,
      userId,
      metadata,
      url
    );

    logger.info({
      layer: "service",
      action: "OCR_UPDATE_FROM_URL_SUCCESS",
      userId,
      invoiceId,
      itemCount: metadata.items?.length ?? 0,
    });

    return invoiceService.getInvoiceById(invoiceId, userId);
  },
};
