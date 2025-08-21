import { prisma } from "@/config/prisma";
import { Invoice, Role } from "@prisma/client";
import { CreateInvoiceInput } from "@/modules/invoice";
import { invoiceIncludeOptions } from "../invoice.query";
import { logger } from "@/shared/utils/logger";

export const createInvoice = async (
  data: CreateInvoiceInput,
  userId: string
) => {
  const invoice = await prisma.invoice.create({
    data: {
      ...data,
      userId,
    },
  });

  logger.info({
    userId,
    invoiceId: invoice.id,
    title: data.title,
    issueDate: data.issueDate,
    expiration: data.expiration,
    action: "INVOICE_CREATE_SUCCESS",
  });

  return invoice;
};
export const getUserInvoices = async (userId: string): Promise<Invoice[]> => {
  logger.info({ userId, action: "INVOICE_GET_ALL_ATTEMPT" });

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: invoiceIncludeOptions,
  });

  logger.info({
    userId,
    invoiceCount: invoices.length,
    action: "INVOICE_GET_ALL_SUCCESS",
  });

  return invoices;
};

export const getInvoiceById = async (id: string, userId: string) => {
  logger.info({ userId, invoiceId: id, action: "INVOICE_GET_BY_ID_ATTEMPT" });

  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
    include: invoiceIncludeOptions,
  });

  if (!invoice) {
    logger.warn({ userId, invoiceId: id, action: "INVOICE_GET_BY_ID_NOT_FOUND" });
  } else {
    logger.info({msg: "Invoice retrieved", userId, invoiceId: id, action: "INVOICE_GET_BY_ID_SUCCESS" });
  }

  return invoice;
};

export const deleteInvoiceById = async (
  invoiceId: string,
  userId: string,
  userRole: Role
) => {
  logger.info({ invoiceId, userId, userRole, action: "INVOICE_DELETE_ATTEMPT" });

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId },
    include: { attachments: true },
  });

  if (!invoice) return null;

  await prisma.invoice.delete({ where: { id: invoiceId } });
  
  logger.info({ invoiceId, userId, action: "INVOICE_DELETE_SUCCESS" });
  return invoice;
};

