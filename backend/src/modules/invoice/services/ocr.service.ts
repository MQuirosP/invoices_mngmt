import { AppError, ImportService } from "@/shared";
import { prisma } from "@/config/prisma";
import { invoiceIncludeOptions } from "../invoice.query";
import { logger } from "@/shared/utils/logging/logger";
import { createInvoice, updateInvoiceFromMetadata } from "./core.service";
import { prepareBufferForExtraction } from "./file.service";

export const createInvoiceFromBuffer = async (
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

  const invoice = await createInvoice(userId, metadata, {
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

  return prisma.invoice.findUnique({
    where: { id: invoice.invoiceId },
    include: invoiceIncludeOptions,
  });
};

export const updateInvoiceFromUrl = async (
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
};