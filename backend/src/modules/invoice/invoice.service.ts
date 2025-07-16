import { prisma } from "@/config/prisma";
import { AppError } from "@/shared/utils/AppError.utils";
import { CreateInvoiceInput } from "@/modules/invoice";
import axios from "axios";
import { ExtractedMetadata } from "@/shared/utils/extractMetadata.utils";
import { getFileExtension } from "@/shared/utils/getFileExtension";
import { CloudinaryService } from "@/shared/services/cloudinary.service";
import { ImportService } from "@/shared/services/import.service";
import { mimeExtensionMap } from "@/shared/constants/mimeExtensionMap";
import { invoiceIncludeOptions } from "./invoice.query";
import { generateRandomFilename } from "@/shared/utils/generateRandomFilename";
import { Role } from "@prisma/client";
import { AttachmentService } from "@/shared/services/attachment.service";
import { logger } from "@/shared/utils/logger";

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

export const createInvoiceWithFiles = async (
  parsed: CreateInvoiceInput,
  userId: string,
  files?: Express.Multer.File[]
) => {
  const invoice = await createInvoice(parsed, userId);

  const uploaded: string[] = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const result = await AttachmentService.uploadValidated(file, invoice.id, userId);
      uploaded.push(result.fileName);
    }
  }
  logger.info(`🧾 Invoice ${invoice.id} created by ${userId} with files: ${uploaded.join(", ")}`);

  return {
    invoice,
    uploadedFiles: uploaded,
  };
};

export const getUserInvoices = async (userId: string) => {
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: invoiceIncludeOptions,
  });
  return invoices;
};

export const getInvoiceById = async (id: string, userId: string) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      userId,
    },
    include: invoiceIncludeOptions,
  });
  return invoice;
};

export const deleteInvoiceById = async (invoiceId: string, userId: string, userRole: Role) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId },
    include: { attachments: true },
  });

  if (!invoice) return null;

  const cloudinaryService = new CloudinaryService();

  for (const attachment of invoice.attachments) {
    await cloudinaryService.delete(
      invoice.userId,
      attachment.fileName,
      attachment.mimeType
    );
  }

  await prisma.invoice.delete({ where: { id: invoiceId } });

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
    include: invoiceIncludeOptions,
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
  const importService = new ImportService();
  const metadata = await importService.extractFromBuffer(buffer);

  // Create invoice record
  const invoice = await prisma.invoice.create({
    data: {
      userId,
      title: metadata.title,
      issueDate: metadata.issueDate,
      expiration: metadata.expiration,
      provider: metadata.provider,
      extracted: true,
      warranty: metadata.duration
        ? {
            create: {
              duration: metadata.duration,
              validUntil: metadata.validUntil!,
            },
          }
        : undefined,
    },
    include: invoiceIncludeOptions,
  });

  // Upload file & attach to invoice
  const attachment = await AttachmentService.uploadValidated(
    {
      buffer,
      mimetype: mimeType,
      originalname: originalName,
    },
    invoice.id,
    userId
  );

  // Return invoice with attachment
  return {
    ...invoice,
    attachments: [attachment],
  };
};


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
  if (!existingAttachment) {
    const ext = getFileExtension(url) || "bin";
    const mimeType =
      Object.entries(mimeExtensionMap).find(([, v]) => v === ext)?.[0] ||
      "application/octet-stream";
    const filename = generateRandomFilename(ext);

    await prisma.attachment.create({
      data: {
        invoiceId,
        url,
        fileName: filename,
        mimeType,
      },
    });

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { updatedAt: new Date() },
    });
  }

  return updateInvoiceFromMetadata(invoiceId, metadata);
};
