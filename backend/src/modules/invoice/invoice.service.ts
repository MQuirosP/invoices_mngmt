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
import { PrismaClientInitializationError } from '@prisma/client/runtime/library'


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

    logger.info({
      invoiceId: invoice.id,
      userId,
      files: uploaded,
      action: "INVOICE_CREATE_WITH_ATTACHMENTS_SUCCESS",
    });
  } else {
    logger.info({
      invoiceId: invoice.id,
      userId,
      action: "INVOICE_CREATE_NO_ATTACHMENTS",
    });
  }
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
  logger.info({
    userId,
    action: "INVOICE_GET_ALL_ATTEMPT",
  });

  const maxRetries = 3
  let invoices: Invoice[] = []

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      invoices = await prisma.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: invoiceIncludeOptions,
      });
      break
    } catch (err: unknown) {
      const error = err as Error

      const isInitError =
        error instanceof PrismaClientInitializationError ||
        error.message?.includes("Can't reach database server")

      if (isInitError && attempt < maxRetries) {
        logger.warn({
          userId,
          attempt,
          action: "INVOICE_DB_RETRY",
          message: "Retrying DB connection due to cold start",
        });
        await new Promise(res => setTimeout(res, 1000 * attempt));
      } else {
        logger.error({
          userId,
          action: "INVOICE_GET_ALL_ERROR",
          error: error.message,
        });
        throw error
      }
    }
  }

  logger.info({
    userId,
    invoiceCount: invoices.length,
    action: "INVOICE_GET_ALL_SUCCESS",
  });

  return invoices;
}

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

  const deleted = await prisma.invoice.delete({ where: { id: invoiceId } });

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
