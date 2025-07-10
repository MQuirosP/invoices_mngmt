import { prisma } from "@/config/prisma";
import { AppError } from "@/shared/utils/AppError";
import { CreateInvoiceInput } from "@/modules/invoices";
import { ImportService } from "@/modules/imports/ocrImport.service";
import axios from "axios";

// type CompleteInvoiceInput = CreateInvoiceInput & {
//   fileUrl: string;
//   fileType: string;
// };


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
    include: {
      attachments: true,
      warranty: true
    }
  });
  return invoices;
};

export const getInvoiceById = async (id: string, userId: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      userId,
    },
  });
  return invoice;
};

export const deleteInvoiceById = async (id: string, userId: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!invoice) return null;

  await prisma.invoice.delete({
    where: { id },
  });

  return invoice;
};

export const updateInvoiceFromOCR = async (
  invoiceId: string,
  userId: string,
  attachmentUrl: string
) => {

  const importService = new ImportService();


  // Validar pertenencia de la factura al usuario
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });

  if (!invoice) throw new AppError("Invoice not found", 404);

  const invoiceWithAttachments = await prisma.invoice.findFirst({
  where: { id: invoiceId, userId },
  include: { attachments: true },
});

const isValidUrl = invoiceWithAttachments?.attachments.some(
  (a) => a.url === attachmentUrl
);
if (!isValidUrl) throw new AppError("URL no corresponde a ningún attachment", 400);


  const updated = await importService.updateInvoiceFromCloudinaryUrl(
    attachmentUrl,
    invoiceId
  );

  return updated;
};

export const downloadAttachment = async (
  userId: string,
  invoiceId: string,
  attachmentId: string
) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { attachments: true},
  });

  if (!invoice) throw new AppError("Invoice not found", 404);

  const attachment = invoice.attachments.find(a => a.id === attachmentId);
  if (!attachment) throw new AppError("Attachment not found", 404);

  const response = await axios.get(attachment.url, { responseType: "stream"});

  const ext = attachment.mimeType.split("/")[1] || "bin";
  const fileName = `${invoice.title.replace(/\s+/g, "_")}.${ext}`;

  return {
    stream: response.data,
    mimeType: response.headers["content-type"],
    fileName
  };
};
