import { prisma } from "@/config/prisma";
import { CloudinaryService } from "@/shared/services/cloudinary.service";
import { AppError } from "@/shared/utils/appError.utils";
import axios from "axios";
import { getFileExtension } from "@/shared/utils/file/getFileExtension";
import { logger } from "@/shared/utils/logging/logger";
import { generateRandomFilename, validateRealMime } from "@/shared";
import { Attachment, Prisma } from "@prisma/client";
import { InvoiceRepository } from "../invoice.repository";

const cloudinaryService = new CloudinaryService();
const invoiceRepo = InvoiceRepository;

export const uploadFiles = async (
  userId: string,
  invoiceId: string,
  files?: Express.Multer.File[]
): Promise<Attachment[]> => {
  logger.info({
    layer: "service",
    action: "INVOICE_ATTACHMENT_UPLOAD_ATTEMPT",
    userId,
    invoiceId,
    fileCount: files?.length ?? 0,
  });

  const attachments: Attachment[] = [];

  if (files?.length) {
    for (const file of files) {
      const attachment = await uploadValidatedFile(file, invoiceId, userId);
      attachments.push(attachment);

      logger.info({
        layer: "service",
        action: "INVOICE_ATTACHMENT_UPLOAD_SUCCESS",
        userId,
        invoiceId,
        attachmentId: attachment.id,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
        url: attachment.url,
      });
    }
  }

  return attachments;
};

export const downloadAttachment = async (
  userId: string,
  invoiceId: string,
  attachmentId: string
) => {
  logger.info({
    layer: "service",
    action: "INVOICE_ATTACHMENT_DOWNLOAD_ATTEMPT",
    userId,
    invoiceId,
    attachmentId,
  });

  const invoice = await invoiceRepo.findById(invoiceId);


  if (!invoice) {
    logger.warn({
      layer: "service",
      action: "INVOICE_ATTACHMENT_DOWNLOAD_INVOICE_NOT_FOUND",
      userId,
      invoiceId,
    });
    throw new AppError("Invoice not found", 404);
  }

  const attachment = invoice.attachments.find((a) => a.id === attachmentId);
  if (!attachment) {
    logger.warn({
      layer: "service",
      action: "INVOICE_ATTACHMENT_DOWNLOAD_NOT_FOUND",
      userId,
      invoiceId,
      attachmentId,
    });
    throw new AppError("Attachment not found", 404);
  }

  const response = await axios.get(attachment.url, {
    responseType: "stream",
  });

  const ext = getFileExtension(attachment.url) || "bin";
  const fileName = `${invoice.title.replace(/\s+/g, "_")}.${ext}`;

  logger.info({
    layer: "service",
    action: "INVOICE_ATTACHMENT_DOWNLOAD_SUCCESS",
    userId,
    invoiceId,
    attachmentId,
    fileName,
    mimeType: response.headers["content-type"],
  });

  return {
    stream: response.data,
    mimeType: response.headers["content-type"],
    fileName,
  };
};

export const deleteAttachments = async (
  userId: string,
  invoiceId: string,
  _unused?: unknown,
  tx: Prisma.TransactionClient = prisma
) => {
  logger.info({
    layer: "service",
    action: "INVOICE_ATTACHMENT_DELETE_BATCH_ATTEMPT",
    userId,
    invoiceId,
  });

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { attachments: true },
  });

  if (!invoice) {
    logger.warn({
      layer: "service",
      action: "INVOICE_ATTACHMENT_DELETE_INVOICE_NOT_FOUND",
      userId,
      invoiceId,
    });
    throw new AppError("Invoice not found", 404);
  }

  try {
    for (const attachment of invoice.attachments) {
      logger.info({
        layer: "service",
        action: "INVOICE_ATTACHMENT_DELETE_ATTEMPT",
        userId,
        invoiceId,
        fileName: attachment.fileName,
        mimeType: attachment.mimeType,
      });

      await cloudinaryService.delete(
        userId,
        attachment.fileName,
        attachment.mimeType
      );

      logger.info({
        layer: "service",
        action: "INVOICE_ATTACHMENT_DELETE_SUCCESS",
        userId,
        invoiceId,
        fileName: attachment.fileName,
      });
    }
  } catch (error: any) {
    logger.error({
      layer: "service",
      action: "INVOICE_ATTACHMENT_DELETE_BATCH_ERROR",
      userId,
      invoiceId,
      reason: error instanceof Error ? error.message : String(error),
    });
    throw new AppError("Failed to delete attachments", 500);
  }

  logger.info({
    layer: "service",
    action: "INVOICE_ATTACHMENT_DELETE_BATCH_SUCCESS",
    userId,
    invoiceId,
    deletedCount: invoice.attachments.length,
  });

  return { success: true, deleted: invoice.attachments.length };
};

export const uploadValidatedFile = async (
  file: Express.Multer.File,
  invoiceId: string,
  userId: string
): Promise<Attachment> => {
  const { buffer, mimetype } = file;
  const { mime, ext } = await validateRealMime(buffer, mimetype);
  const filename = generateRandomFilename(mime, invoiceId);
  const result = await cloudinaryService.upload(buffer, filename, mime, userId);

  if (!result?.url) throw new AppError("Upload failed", 500);

  return prisma.attachment.create({
    data: {
      invoiceId,
      url: result.url,
      mimeType: mime,
      fileName: `${filename}.${ext}`,
    },
  });
};