import { prisma } from "@/config/prisma";
import { AppError } from "@/shared/utils/AppError";
import { CreateInvoiceInput } from "@/modules/invoices";
import axios from "axios";
import { OCRService } from "../../shared/services/ocr.service";
import { extractMetadataFromText } from "../../shared";

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
    include: {
      attachments: true,
      warranty: true,
     }
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
  // Validar que la factura exista y pertenezca al usuario
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { attachments: true },
  });

  if (!invoice) throw new AppError("Invoice not found", 404);

  const isValidUrl = invoice.attachments.some((a) => a.url === attachmentUrl);
  if (!isValidUrl)
    throw new AppError("Attachment URL does not belong to this invoice", 400);

  // Extraer texto con OCR (asumiendo que tienes un servicio OCR)
  const text = await OCRService.extractTextFromImage(attachmentUrl);

  const metadata = extractMetadataFromText(text);

  // Actualizar la factura y la garantía (si aplica)
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      title: metadata.title,
      issueDate: metadata.issueDate,
      expiration: metadata.expiration,
      provider: metadata.provider,
      extracted: true,
      warranty: metadata.duration
  ? {
      upsert: {
        update: {
          duration: metadata.duration,
          validUntil: metadata.validUntil ?? undefined ,
        },
        create: {
          duration: metadata.duration,
          validUntil: metadata.validUntil ?? new Date(),
        },
      },
    }
  : undefined,

    },
  });

  return updatedInvoice;
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
