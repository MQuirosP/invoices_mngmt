import { logger } from "../../shared";
import { InvoiceRepository } from "./invoice.repository";

export const invoiceIncludeOptions = {
  attachments: {
    select: {
      url: true,
      mimeType: true,
      fileName: true,
    }
  },
  // warranty: true,
  items: {
    select: {
      description: true,
      quantity: true,
      unitPrice: true,
      warrantyDuration: true,
      warrantyValidUntil: true,
      warrantyNotes: true,
    },
  },

};

export const getInvoiceById = async (invoiceId: string, userId: string) => {
    logger.info({
      layer: "service",
      action: "INVOICE_GET_BY_ID_ATTEMPT",
      userId,
      invoiceId: invoiceId,
    });

    const invoiceRepo = InvoiceRepository

    const invoice = await invoiceRepo.findById(invoiceId);
    if (invoice?.userId !== userId) return null;

    if (!invoice) {
      logger.warn({
        layer: "service",
        action: "INVOICE_GET_BY_ID_NOT_FOUND",
        userId,
        invoiceId: invoiceId,
      });
    } else {
      logger.info({
        layer: "service",
        action: "INVOICE_GET_BY_ID_SUCCESS",
        userId,
        invoiceId: invoiceId,
      });
    }
    
    return invoice;
  }