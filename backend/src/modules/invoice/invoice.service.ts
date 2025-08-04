import { prisma } from "@/config/prisma";
import { AppError } from "@/shared/utils/AppError.utils";
import { CreateInvoiceInput } from "@/modules/invoice";
import axios from "axios";
// import { ExtractedMetadata } from "@/shared/utils/extractMetadata.utils";
import { getFileExtension } from "@/shared/utils/getFileExtension";
import { CloudinaryService } from "@/shared/services/cloudinary.service";
import { ImportService } from "@/shared/services/import.service";
import { mimeExtensionMap } from "@/shared/constants/mimeExtensionMap";
import { invoiceIncludeOptions } from "./invoice.query";
import { generateRandomFilename } from "@/shared/utils/generateRandomFilename";
import { Role } from "@prisma/client";
import { AttachmentService } from "@/shared/services/attachment.service";
import { logger } from "@/shared/utils/logger";
import { ExtractedInvoiceMetadata } from "@/shared/ocr/ocr.types";

export const createInvoice = async (
  data: CreateInvoiceInput,
  userId: string
) => {
  logger.info({
    userId,
    title: data.title,
    issueDate: data.issueDate,
    expiration: data.expiration,
    action: "CREATE_INVOICE_RECORD",
  });
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
      const result = await AttachmentService.uploadValidated(
        file,
        invoice.id,
        userId
      );
      uploaded.push(result.fileName);
    }
  }
  logger.info(
    `🧾 Invoice ${invoice.id} created by ${userId} with files: ${uploaded.join(
      ", "
    )}`
  );
  const invoiceWithRelations = await prisma.invoice.findUnique({
    where: { id: invoice.id },
    include: invoiceIncludeOptions,
  });

  if (!invoiceWithRelations)
    throw new AppError("Failed to retrieve invoice attarchments", 404);
  return {
    invoice: invoiceWithRelations,
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
  logger.info({ userId, action: "GET_USER_INVOICES" });
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      userId,
    },
    include: invoiceIncludeOptions,
  });
  return invoice;
};

export const deleteInvoiceById = async (
  invoiceId: string,
  userId: string,
  userRole: Role
) => {
  logger.info({ invoiceId, userId, userRole, action: "DELETE_INVOICE_INIT" });
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId },
    include: { attachments: true },
  });

  if (!invoice) {
    logger.warn({ invoiceId, action: "INVOICE_NOT_FOUND" });
    return null;
  }

  const cloudinaryService = new CloudinaryService();

  for (const attachment of invoice.attachments) {
    logger.info({ invoiceId, fileName: attachment.fileName, action: "DELETE_ATTACHMENT_CLOUDINARY" });
    await cloudinaryService.delete(
      invoice.userId,
      attachment.fileName,
      attachment.mimeType
    );
  }

  // await prisma.invoice.delete({ where: { id: invoiceId } });
  logger.info({ invoiceId, userId, action: "INVOICE_DELETED" });
  return prisma.invoice.delete({ where: { id: invoiceId } });
};

export const updateInvoiceFromMetadata = async (
  invoiceId: string,
  metadata: ExtractedInvoiceMetadata
) => {
  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      title: metadata.title,
      issueDate: metadata.issueDate,
      expiration: metadata.expiration ?? new Date(),
      provider: metadata.provider ?? "Desconocido",
      extracted: true,
    },
    include: invoiceIncludeOptions,
  });
};

export const downloadAttachment = async (
  userId: string,
  invoiceId: string,
  attachmentId: string
) => {
  logger.info({ userId, invoiceId, attachmentId, action: "DOWNLOAD_ATTACHMENT_INIT" });
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

  logger.info({ invoiceId, fileName, action: "DOWNLOAD_ATTACHMENT_SUCCESS" });

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
  logger.info({ userId, fileName: originalName, mimeType, action: "CREATE_FROM_BUFFER_OCR" });
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
    },
    include: invoiceIncludeOptions,
  });

  if (metadata.items?.length) {
    await prisma.invoiceItem.createMany({
      data: metadata.items.map((item) => ({
        ...item,
        invoiceId: invoice.id,
      })),
    });
  }

  if (metadata.items?.length) {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
    await prisma.invoiceItem.createMany({
      data: metadata.items.map((item) => ({
        ...item,
        invoiceId: invoice.id,
      })),
    });
  }

  // Upload file & attach to invoice
  await AttachmentService.uploadValidated(
    {
      buffer,
      mimetype: mimeType,
      originalname: originalName,
    },
    invoice.id,
    userId
  );

  logger.info({ userId, invoiceId: invoice.id, action: "CREATE_FROM_BUFFER_OCR_SUCCESS" });
  // Return invoice with attachment
  return getInvoiceById(invoice.id, userId);
};

export const updateInvoiceFromUrlOcr = async (
  invoiceId: string,
  userId: string,
  url: string
) => {
  logger.info({ userId, invoiceId, url, action: "UPDATE_FROM_URL_OCR" });
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
    const filename = generateRandomFilename(mimeType);
    await prisma.attachment.create({
      data: {
        invoiceId,
        url,
        fileName: filename,
        mimeType,
      },
    });
  }

  await updateInvoiceFromMetadata(invoiceId, metadata);

  await prisma.invoiceItem.deleteMany({ where: { invoiceId } });

  if (metadata.items?.length) {
    await prisma.invoiceItem.createMany({
      data: metadata.items.map((item) => ({
        ...item,
        invoiceId: invoice.id,
      })),
    });
  }

  logger.info({ userId, invoiceId, itemCount: metadata.items?.length ?? 0, action: "UPDATE_FROM_URL_OCR_SUCCESS" });
  // const fullInvoice = await getInvoiceById(invoiceId, userId);
  return getInvoiceById(invoiceId, userId);
};
