import { prisma } from "@/config/prisma";
import { Invoice, Role } from "@prisma/client";
import { FileService } from "@/modules/invoice";
import { invoiceIncludeOptions } from "../invoice.query";
import { logger } from "@/shared/utils/logging/logger";
import { CloudinaryService } from "@/shared/services/cloudinary.service";
import { ExtractedInvoiceMetadata } from "@/shared/ocr/core/ocr.types";

const cloudinaryService = new CloudinaryService();
const fileService = new FileService(cloudinaryService);

export const createInvoice = async (
  userId: string,
  metadata: ExtractedInvoiceMetadata,
  file?: Express.Multer.File
): Promise<{ invoiceId: string }> => {
  return await prisma.$transaction(async (tx) => {
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

    if (file) {
      await fileService.uploadFiles(userId, invoice.id, [file], tx);
    }

    return { invoiceId: invoice.id };
  });
};

export const getUserInvoices = async (userId: string): Promise<Invoice[]> => {
  logger.info({
    layer: "service",
    action: "INVOICE_GET_ALL_ATTEMPT",
    userId,
  });

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: invoiceIncludeOptions,
  });

  logger.info({
    layer: "service",
    action: "INVOICE_GET_ALL_SUCCESS",
    userId,
    invoiceCount: invoices.length,
  });

  return invoices;
};

export const getInvoiceById = async (id: string, userId: string) => {
  logger.info({
    layer: "service",
    action: "INVOICE_GET_BY_ID_ATTEMPT",
    userId,
    invoiceId: id,
  });

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
    include: invoiceIncludeOptions,
  });

  if (!invoice) {
    logger.warn({
      layer: "service",
      action: "INVOICE_GET_BY_ID_NOT_FOUND",
      userId,
      invoiceId: id,
    });
  } else {
    logger.info({
      layer: "service",
      action: "INVOICE_GET_BY_ID_SUCCESS",
      userId,
      invoiceId: id,
    });
  }

  return invoice;
};

export const deleteInvoiceById = async (
  invoiceId: string,
  userId: string,
  userRole: Role
) => {
  logger.info({
    layer: "service",
    action: "INVOICE_DELETE_ATTEMPT",
    invoiceId,
    userId,
    userRole,
  });

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId },
    include: { attachments: true },
  });

  if (!invoice) {
    logger.warn({
      layer: "service",
      action: "INVOICE_DELETE_NOT_FOUND",
      invoiceId,
      userId,
    });
    return null;
  }

  await prisma.$transaction(async (tx) => {
  await fileService.deleteAttachments(userId, invoiceId, tx);

  await tx.invoice.delete({
    where: { id: invoiceId },
  });
});


  logger.info({
    layer: "service",
    action: "INVOICE_DELETE_SUCCESS",
    invoiceId,
    userId,
  });

  return invoice;
};

export const updateInvoiceFromMetadata = async (
  invoiceId: string,
  userId: string,
  metadata: ExtractedInvoiceMetadata,
  url: string
): Promise<void> => {
  return await prisma.$transaction(async (tx) => {
    const existingAttachment = await tx.attachment.findFirst({
      where: { invoiceId, url },
    });

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
        data: metadata.items.map((item) => ({
          ...item,
          invoiceId,
        })),
      });
    }
  });
};