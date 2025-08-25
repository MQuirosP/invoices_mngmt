import { prisma } from "@/config/prisma";
import { CloudinaryService } from "@/shared/services/cloudinary.service";
import { AppError } from "@/shared/utils/appError.utils";
import axios from "axios";
import { getFileExtension } from "@/shared/utils/file/getFileExtension";
import { logger } from "@/shared/utils/logging/logger";
import { AttachmentService } from "../../../shared";
import { Prisma } from "@prisma/client";

export class FileService {
  constructor(private cloudinaryService: CloudinaryService) {}

  async uploadFiles(
    userId: string,
    invoiceId: string,
    files?: Express.Multer.File[],
    tx: Prisma.TransactionClient = prisma // 👈 usa tx si lo pasan, si no usa prisma
  ) {
    logger.info({
      layer: "service",
      action: "INVOICE_ATTACHMENT_UPLOAD_ATTEMPT",
      userId,
      invoiceId,
      fileCount: files?.length ?? 0,
    });

    const attachments = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const draft = await AttachmentService.uploadValidated(
          {
            buffer: file.buffer,
            mimetype: file.mimetype,
            originalname: file.originalname,
          },
          invoiceId,
          userId
        );

        // 👇 usa tx en lugar de prisma
        const attachment = await tx.attachment.create({
          data: draft,
        });

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

        attachments.push(attachment);
      }
    }

    return attachments;
  }

  async downloadAttachment(
    userId: string,
    invoiceId: string,
    attachmentId: string
  ) {
    logger.info({
      layer: "service",
      action: "INVOICE_ATTACHMENT_DOWNLOAD_ATTEMPT",
      userId,
      invoiceId,
      attachmentId,
    });

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { attachments: true },
    });

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
  }

  async deleteAttachments(userId: string, invoiceId: string) {
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
      await prisma.$transaction(async (tx) => {
        for (const attachment of invoice.attachments) {
          logger.info({
            layer: "service",
            action: "INVOICE_ATTACHMENT_DELETE_ATTEMPT",
            userId,
            invoiceId,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
          });

          await this.cloudinaryService.delete(
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

        await tx.attachment.deleteMany({
          where: { invoiceId },
        });
      });
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
  }
}
