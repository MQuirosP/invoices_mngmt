import { prisma } from "@/config/prisma";
import { AppError } from "@/shared/utils/AppError.utils";
import { CreateInvoiceInput } from "@/modules/invoices";
import axios from "axios";
// import { OCRService } from "@/shared/services/ocr.service";
import { ExtractedMetadata } from "@/shared/utils/extractMetadata.utils";
import { OCRService } from "../../shared/services/ocr.service";

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

export const updateInvoiceFromMetadata = async (
  invoiceId: string,
  metadata: ExtractedMetadata
) => {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      title: metadata.title,
      issueDate: metadata.issueDate,
      expiration: metadata.expiration ?? new Date(),
      provider: metadata.provider ?? "Desconocido",
      extracted: true,
      warranty: metadata.duration
        ? {
            upsert: {
              update: {
                duration: metadata.duration,
                validUntil:
                  metadata.validUntil ??
                  new Date(
                    metadata.issueDate.getTime() + metadata.duration * 86400000
                  ),
              },
              create: {
                duration: metadata.duration,
                validUntil:
                  metadata.validUntil ??
                  new Date(
                    metadata.issueDate.getTime() + metadata.duration * 86400000
                  ),
              },
            },
          }
        : undefined,
    },
    include: {
      attachments: true,
      warranty: true,
    },
  });
};

export const updateInvoiceFromOCR = async (
  invoiceId: string,
  userId: string,
  attachmentUrl: string
) => {
  // Verificar que la factura existe y pertenece al usuario
  const invoice = await getInvoiceById(invoiceId, userId);
  if (!invoice) {
    throw new AppError("Invoice not found or access denied", 404);
  }

  // Validar que el URL está entre los attachments de la factura
  const attachment = await prisma.attachment.findFirst({
    where: {
      invoiceId,
      url: attachmentUrl,
    },
  });

  if (!attachment) {
    throw new AppError("El archivo no pertenece a esta factura", 403);
  }

  // Extraer metadata usando OCR del attachment
  const metadata = await OCRService.extractMetadataFromImage(attachmentUrl);

  // Actualizar la factura con la metadata extraída
  return updateInvoiceFromMetadata(invoiceId, metadata);
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
