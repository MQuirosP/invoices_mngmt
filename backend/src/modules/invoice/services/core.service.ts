import { prisma } from "@/config/prisma";
import { Invoice, Role } from "@prisma/client";
import { CreateInvoiceInput } from "@/modules/invoice";
import { invoiceIncludeOptions } from "../invoice.query";
import { logger } from "@/shared/utils/logging/logger";

export const createInvoice = async (
  data: CreateInvoiceInput,
  userId: string
) => {
  logger.info({
    layer: "service",
    action: "INVOICE_CREATE_ATTEMPT",
    userId,
    payload: {
      title: data.title,
      issueDate: data.issueDate,
      expiration: data.expiration,
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      ...data,
      userId,
    },
  });

  logger.info({
    layer: "service",
    action: "INVOICE_CREATE_SUCCESS",
    userId,
    invoiceId: invoice.id,
    title: data.title,
    issueDate: data.issueDate,
    expiration: data.expiration,
  });

  return invoice;
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

  await prisma.invoice.delete({ where: { id: invoiceId } });

  logger.info({
    layer: "service",
    action: "INVOICE_DELETE_SUCCESS",
    invoiceId,
    userId,
  });

  return invoice;
};