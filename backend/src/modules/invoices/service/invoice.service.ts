import { prisma } from "../../../config/prisma";
import { CreateInvoiceInput } from "../schemas/invoice.schema";

export const createInvoice = async (
  data: CreateInvoiceInput,
  userId: string
) => {
  const invoice = await prisma.invoice.create({
    data: {
      ...data,
      issueDate: new Date(data.issueDate),
      expiration: new Date(data.expiration),
      userId,
    },
  });
  return invoice;
};

export const getUserInvoices = async (userId: string) => {
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return invoices;
};

export const getInvoiceById = async (id: string, userId: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id, userId,
    },
  });
  return invoice;
}

export const deleteInvoiceById = async (id: string, userId: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id, userId,
    },
  });

  if (!invoice) return null;

  await prisma.invoice.delete({
    where: { id },
  });

  return invoice
}
