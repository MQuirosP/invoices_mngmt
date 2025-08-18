import { prisma } from "@/config/prisma";
import { AppError } from "@/shared/utils/AppError.utils";
import { CreateInvoiceInput } from "@/modules/invoice";
import axios from "axios";
// import { ExtractedMetadata } from "@/shared/utils/extractMetadata.utils";
import { getFileExtension } from "@/shared/utils/file/getFileExtension";
import { CloudinaryService } from "@/shared/services/cloudinary.service";
import { ImportService } from "@/shared/services/import.service";
import { mimeExtensionMap } from "@/shared/constants/mimeExtensionMap";
import { invoiceIncludeOptions } from "./invoice.query";
import { generateRandomFilename } from "@/shared/utils/file/generateRandomFilename";
import { Invoice, Role } from "@prisma/client";
import { AttachmentService } from "@/shared/services/attachment.service";
import { logger } from "@/shared/utils/logger";
import { ExtractedInvoiceMetadata } from "@/shared/ocr/ocr.types";
import cloudinary from "../../config/cloudinary";
import { retry } from "../../shared/utils/retries/retryMethods";

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

export const createInvoiceWithFiles = async (
  parsed: CreateInvoiceInput,
  userId: string,
  files?: Express.Multer.File[]
) => {
  const uploads: {
    secure_url: string;
    original_filename: string;
    format: string;
  }[] = [];

  // 1. Subida de archivos a Cloudinary
  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const result = await retry(() =>
          cloudinary.uploader.upload(file.path, {
            folder: `invoices/${userId}`,
            resource_type: "auto",
          })
        );
        uploads.push({
          secure_url: result.secure_url,
          original_filename: result.original_filename,
          format: result.format,
        });
      } catch (error) {
        logger.error({
          action: "CLOUDINARY_UPLOAD_FAILED",
          userId,
          fileName: file.originalname,
          error: error instanceof Error ? error.message : String(error),
          context: "INVOICE_CREATE",
        });
        throw new AppError("Failed to upload file to Cloudinary", 500);
      }
    }
  }

  // 2. Creación de factura + adjuntos en transacción
  let invoice;
  try {
    invoice = await prisma.$transaction(async (tx) => {
      const createdInvoice = await tx.invoice.create({
        data: { ...parsed, userId },
      });

      for (const upload of uploads) {
        await tx.attachment.create({
          data: {
            invoiceId: createdInvoice.id,
            url: upload.secure_url,
            fileName: upload.original_filename,
            mimeType: upload.format,
          },
        });
      }

      return createdInvoice;
    });
  } catch (error) {
    logger.error({
      action: "INVOICE_DB_TRANSACTION_FAILED",
      userId,
      error: error instanceof Error ? error.message : String(error),
      context: "INVOICE_CREATE",
    });
    throw new AppError("Failed to persist invoice and attachments", 500);
  }

  // 3. Obtener factura con relaciones
  const invoiceWithRelations = await prisma.invoice.findUnique({
    where: { id: invoice.id },
    include: invoiceIncludeOptions,
  });

  if (!invoiceWithRelations) {
    logger.error({
      action: "INVOICE_RETRIEVE_FAILED",
      invoiceId: invoice.id,
      userId,
      context: "INVOICE_CREATE",
    });
    throw new AppError("Failed to retrieve invoice with attachments", 404);
  }

  // 4. Log de éxito
  logger.info({
    action: files?.length
      ? "INVOICE_CREATE_WITH_ATTACHMENTS_SUCCESS"
      : "INVOICE_CREATE_NO_ATTACHMENTS",
    invoiceId: invoice.id,
    userId,
    files: uploads.map((f) => f.original_filename),
  });

  return {
    invoice: invoiceWithRelations,
    uploadedFiles: uploads.map((f) => f.original_filename),
  };
};

export const getUserInvoices = async (userId: string): Promise<Invoice[]> => {
  logger.info({
    userId,
    action: "INVOICE_GET_ALL_ATTEMPT",
  });

  try {
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
  } catch (error) {
    logger.error({
      userId,
      action: "UNHANDLED_ERROR",
      message: (error as Error).message,
    });
    throw error;
  }
};
export const getInvoiceById = async (id: string, userId: string) => {
  logger.info({
    userId,
    invoiceId: id,
    action: "INVOICE_GET_BY_ID_ATTEMPT",
  });

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      userId,
    },
    include: invoiceIncludeOptions,
  });

  if (!invoice) {
    logger.warn({
      userId,
      invoiceId: id,
      action: "INVOICE_GET_BY_ID_NOT_FOUND",
    });
  } else {
    logger.info({
      userId,
      invoiceId: id,
      action: "INVOICE_GET_BY_ID_SUCCESS",
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
    invoiceId,
    userId,
    userRole,
    action: "INVOICE_DELETE_ATTEMPT",
  });

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId },
    include: { attachments: true },
  });

  if (!invoice) {
    logger.warn({
      invoiceId,
      userId,
      action: "INVOICE_DELETE_NOT_FOUND",
    });
    return null;
  }

  const cloudinaryService = new CloudinaryService();

  for (const attachment of invoice.attachments) {
    logger.info({
      invoiceId,
      userId,
      fileName: attachment.fileName,
      action: "INVOICE_ATTACHMENT_DELETE_ATTEMPT",
    });

    await cloudinaryService.delete(
      invoice.userId,
      attachment.fileName,
      attachment.mimeType
    );
  }

  const deleted = await prisma.invoice.delete({
    where: { id: invoiceId },
    include: invoiceIncludeOptions,
  });

  logger.info({
    invoiceId,
    userId,
    action: "INVOICE_DELETE_SUCCESS",
  });

  return deleted;
};

export const updateInvoiceFromMetadata = async (
  invoiceId: string,
  metadata: ExtractedInvoiceMetadata
) => {
  logger.info({
    invoiceId,
    title: metadata.title,
    issueDate: metadata.issueDate,
    expiration: metadata.expiration,
    provider: metadata.provider,
    action: "INVOICE_UPDATE_METADATA_ATTEMPT",
  });

  const updated = await prisma.invoice.update({
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

  logger.info({
    invoiceId,
    action: "INVOICE_UPDATE_METADATA_SUCCESS",
  });

  return updated;
};

export const downloadAttachment = async (
  userId: string,
  invoiceId: string,
  attachmentId: string
) => {
  logger.info({
    userId,
    invoiceId,
    attachmentId,
    action: "INVOICE_DOWNLOAD_ATTEMPT",
  });

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: { attachments: true },
  });

  if (!invoice) {
    logger.warn({
      userId,
      invoiceId,
      action: "INVOICE_DOWNLOAD_INVOICE_NOT_FOUND",
    });
    throw new AppError("Invoice not found", 404);
  }

  const attachment = invoice.attachments.find((a) => a.id === attachmentId);
  if (!attachment) {
    logger.warn({
      userId,
      invoiceId,
      attachmentId,
      action: "INVOICE_DOWNLOAD_ATTACHMENT_NOT_FOUND",
    });
    throw new AppError("Attachment not found", 404);
  }

  const response = await axios.get(attachment.url, { responseType: "stream" });

  const ext = getFileExtension(attachment.url) || "bin";
  const fileName = `${invoice.title.replace(/\s+/g, "_")}.${ext}`;

  logger.info({
    userId,
    invoiceId,
    attachmentId,
    fileName,
    action: "INVOICE_DOWNLOAD_SUCCESS",
  });

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
  logger.info({
    userId,
    fileName: originalName,
    mimeType,
    action: "INVOICE_OCR_CREATE_ATTEMPT",
  });

  const importService = new ImportService();
  const metadata = await importService.extractFromBuffer(buffer);

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

  await AttachmentService.uploadValidated(
    {
      buffer,
      mimetype: mimeType,
      originalname: originalName,
    },
    invoice.id,
    userId
  );

  logger.info({
    userId,
    invoiceId: invoice.id,
    itemCount: metadata.items?.length ?? 0,
    action: "INVOICE_OCR_CREATE_SUCCESS",
  });

  return getInvoiceById(invoice.id, userId);
};

export const updateInvoiceFromUrlOcr = async (
  invoiceId: string,
  userId: string,
  url: string
) => {
  logger.info({
    userId,
    invoiceId,
    url,
    action: "INVOICE_OCR_UPDATE_ATTEMPT",
  });

  const invoice = await getInvoiceById(invoiceId, userId);
  if (!invoice) {
    logger.warn({
      userId,
      invoiceId,
      action: "INVOICE_OCR_UPDATE_NOT_FOUND",
    });
    throw new AppError("Invoice not found", 404);
  }

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

    logger.info({
      userId,
      invoiceId,
      fileName: filename,
      action: "INVOICE_OCR_ATTACHMENT_CREATED",
    });
  } else {
    logger.info({
      userId,
      invoiceId,
      action: "INVOICE_OCR_ATTACHMENT_ALREADY_EXISTS",
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

  logger.info({
    userId,
    invoiceId,
    itemCount: metadata.items?.length ?? 0,
    action: "INVOICE_OCR_UPDATE_SUCCESS",
  });

  return getInvoiceById(invoiceId, userId);
};
