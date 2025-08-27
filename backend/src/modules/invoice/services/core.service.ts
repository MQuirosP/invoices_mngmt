import { InvoiceRepository } from "./../invoice.repository";
import { prisma } from "@/config/prisma";
import { Invoice, Role } from "@prisma/client";
import { logger } from "@/shared/utils/logging/logger";
import { ExtractedInvoiceMetadata } from "@/shared/ocr/core/ocr.types";
import { InvoiceFileService } from "./file.service";

const invoiceRepo = InvoiceRepository;
const fileService = InvoiceFileService;

export const InvoiceService = {
  createInvoice: async (
    userId: string,
    metadata: ExtractedInvoiceMetadata,
    file?: Express.Multer.File
  ): Promise<{ invoiceId: string }> => {
    const invoice = await prisma.$transaction(async (tx) => {
      const created = await invoiceRepo.create({
        userId,
        title: metadata.title,
        issueDate: metadata.issueDate,
        expiration: metadata.expiration,
        provider: metadata.provider,
        extracted: true,
      });

      if (metadata.items?.length) {
        await tx.invoiceItem.createMany({
          data: metadata.items.map((item) => ({
            ...item,
            invoiceId: created.id,
          })),
        });
      }

      return created;
    });

    if (file) {
      await fileService.uploadFiles(userId, invoice.id, [file]);
    }

    return { invoiceId: invoice.id };
  },

  getUserInvoices: async (userId: string): Promise<Invoice[]> => {
    logger.info({
      layer: "service",
      action: "INVOICE_GET_ALL_ATTEMPT",
      userId,
    });

    const invoices = await invoiceRepo.findByUserId(userId);

    logger.info({
      layer: "service",
      action: "INVOICE_GET_ALL_SUCCESS",
      userId,
      invoiceCount: invoices.length,
    });

    return invoices;
  },

  

  deleteInvoiceById: async (
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

    const invoice = await invoiceRepo.findById(invoiceId);
    // const invoice = await prisma.invoice.findFirst({
    //   where: { id: invoiceId },
    //   include: { attachments: true },
    // });
    
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
      await fileService.deleteAttachments(userId, invoiceId, undefined, tx);

      await tx.invoice.deleteMany({
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
  },

  updateInvoiceFromMetadata: async (
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
  },
};
