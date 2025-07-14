import { prisma } from "@/config/prisma";
import { AppError } from "@/shared/utils/AppError.utils";
import { CreateInvoiceInput } from "@/modules/invoice";
import axios from "axios";
import { ExtractedMetadata } from "@/shared/utils/extractMetadata.utils";
import { getFileExtension } from "@/shared/utils/getFileExtension";
import { CloudinaryService } from "@/shared/services/cloudinary.service";
import { ImportService } from '@/shared/services/import.service';
import { mimeExtensionMap } from '@/shared/constants/mimeExtensionMap';

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
  console.log(invoice);
  return invoice;
};

export const getUserInvoices = async (userId: string) => {
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      attachments: true,
      warranty: true,
    },
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

export const downloadAttachment = async (
  userId: string,
  invoiceId: string,
  attachmentId: string
) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { attachments: true },
  });

  if (!invoice) throw new AppError("Invoice not found", 404);

  const attachment = invoice.attachments.find((a) => a.id === attachmentId);
  if (!attachment) throw new AppError("Attachment not found", 404);

  const response = await axios.get(attachment.url, { responseType: "stream" });

  const ext = getFileExtension(attachment.url) || "bin";
  const fileName = `${invoice.title.replace(/\s+/g, "_")}.${ext}`;

  return {
    stream: response.data,
    mimeType: response.headers["content-type"],
    fileName,
  };
};

export const createInvoiceFromBufferOCR = async (
  buffer: Buffer,
  userId: string,
  originalName: string,
  mimeType: string
) => {
  const imnportService = new ImportService();
  const metadata = await imnportService.extractFromBuffer(buffer);
  const ext = getFileExtension(originalName) || "bin";
  const uploadRes = await new CloudinaryService().upload(
    buffer,
    metadata.title,
    mimeType
  );
  return prisma.invoice.create({
    data: {
      userId,
      title: metadata.title,
      issueDate: metadata.issueDate,
      expiration: metadata.expiration,
      provider: metadata.provider,
      extracted: true,
      attachments: {
        create: [
          {
            url: uploadRes.url,
            mimeType,
            fileName: `${metadata.title}.${ext}`,
          },
        ],
      },
      warranty: metadata.duration ?
        {
          create: {
            duration: metadata.duration,
            validUntil: metadata.validUntil!,
          },
        } : undefined,
    },
    include: { attachments: true, warranty: true },
  })
}

export const updateInvoiceFromUrlOcr = async (
  invoiceId: string,
  userId: string,
  url: string
) => {
  const invoice = await getInvoiceById(invoiceId, userId);
  if (!invoice) throw new AppError("Invoice not found", 404);

  const importService = new ImportService();
  const metadata = await importService.extractFromUrl(url);
  const existingAttachment = await prisma.attachment.findFirst({
    where: { invoiceId, url },
  });
  console.log(existingAttachment)
  if (!existingAttachment) {
    const ext = getFileExtension(url) || "bin";
    const mimeType = Object.entries(mimeExtensionMap).find(([, v]) => v === ext)?.[0] || "application/octet-stream";
    await prisma.attachment.create({
      data: {
        invoiceId,
        url,
        fileName: `${metadata.title}.${ext}`,
        mimeType,
      },
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { updatedAt: new Date() },
    });
  }

  return updateInvoiceFromMetadata(invoiceId, metadata);
}

