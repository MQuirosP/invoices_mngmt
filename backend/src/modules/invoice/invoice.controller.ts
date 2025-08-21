import { Response, NextFunction } from "express";
import { requireUserId } from "@/shared/utils/security/requireUserId";
import { AppError } from "@/shared/utils/AppError";
import { AuthRequest } from "@/modules/auth/auth.types";
import { logger } from "@/shared/utils/logger";

import {
  createInvoice,
  getUserInvoices,
  getInvoiceById,
  deleteInvoiceById,
} from "@/modules/invoice/services/core.service";
import { Role } from "@prisma/client";
import { FileService, OCRService } from "@/modules/invoice";
import { prisma } from "@/config/prisma";
import { createInvoiceSchema } from "./schemas/invoice.schema";
import { CloudinaryService, ImportService } from "@/shared";

export class InvoiceController {
  private fileService: FileService;
  private ocrService: OCRService;

  constructor() {
    const cloudinaryService = new CloudinaryService();
    const importService = new ImportService();

    this.fileService = new FileService(cloudinaryService);
    this.ocrService = new OCRService(importService);
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const userId = requireUserId(req);
    try {
      logger.info({
        layer: "controller",
        action: "INVOICE_CREATE_ATTEMPT",
        userId,
        payload: req.body,
      });

      const parsed = createInvoiceSchema.parse(req.body);
      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || files.length === 0) {
        logger.warn({
          layer: "controller",
          action: "INVOICE_CREATE_NO_FILES",
          userId,
        });
      }

      const invoice = await createInvoice(parsed, userId);
      const uploads = files?.length
        ? await this.fileService.uploadFiles(userId, invoice.id, files)
        : [];

      logger.info({
        layer: "controller",
        action: "INVOICE_CREATE_SUCCESS",
        userId,
        invoiceId: invoice.id,
        attachmentCount: uploads.length,
        durationMs: Date.now() - startTime,
      });

      res.status(201).json({
        success: true,
        message: `Invoice created with ${uploads.length} attachment(s)`,
        data: await getInvoiceById(invoice.id, userId),
      });
    } catch (error) {
      logger.error({
        layer: "controller",
        action: "INVOICE_CREATE_ERROR",
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    const userId = requireUserId(req);
    try {
      logger.info({
        layer: "controller",
        action: "INVOICE_LIST_ATTEMPT",
        userId,
      });

      const invoices = await getUserInvoices(userId);

      logger.info({
        layer: "controller",
        action: "INVOICE_LIST_SUCCESS",
        userId,
        count: invoices.length,
      });

      res.status(200).json({ success: true, data: invoices });
    } catch (error) {
      logger.error({
        layer: "controller",
        action: "INVOICE_LIST_ERROR",
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    const userId = requireUserId(req);
    const invoiceId = req.params.invoiceId;
    try {
      logger.info({
        layer: "controller",
        action: "INVOICE_GET_ATTEMPT",
        userId,
        invoiceId,
      });

      const invoice = await getInvoiceById(invoiceId, userId);

      logger.info({
        layer: "controller",
        action: "INVOICE_GET_SUCCESS",
        userId,
        invoiceId,
      });

      res.status(200).json({ success: true, data: invoice });
    } catch (error) {
      logger.error({
        layer: "controller",
        action: "INVOICE_GET_ERROR",
        userId,
        invoiceId,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    const userId = requireUserId(req);
    const invoiceId = req.params.id;
    const userRole = req.user?.role as Role;
    try {
      logger.info({
        layer: "controller",
        action: "INVOICE_REMOVE_ATTEMPT",
        userId,
        invoiceId,
      });

      const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, userId },
        include: { attachments: true },
      });

      if (!invoice) throw new AppError("Invoice not found", 404);

      await this.fileService.deleteAttachments(userId, invoiceId);
      const deletedInvoice = await deleteInvoiceById(invoiceId, userId, userRole);

      logger.info({
        layer: "controller",
        action: "INVOICE_REMOVE_SUCCESS",
        userId,
        invoiceId,
      });

      res.status(200).json({
        success: true,
        message: "Invoice deleted",
        data: deletedInvoice,
      });
    } catch (error) {
      logger.error({
        layer: "controller",
        action: "INVOICE_REMOVE_ERROR",
        userId,
        invoiceId,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  async download(req: AuthRequest, res: Response, next: NextFunction) {
    const userId = requireUserId(req);
    const { invoiceId, attachmentId } = req.params;
    try {
      logger.info({
        layer: "controller",
        action: "INVOICE_DOWNLOAD_ATTEMPT",
        userId,
        invoiceId,
        attachmentId,
      });

      const { stream, mimeType, fileName } = await this.fileService.downloadAttachment(
        userId,
        invoiceId,
        attachmentId
      );

      logger.info({
        layer: "controller",
        action: "INVOICE_DOWNLOAD_SUCCESS",
        userId,
        invoiceId,
        attachmentId,
        fileName,
      });

      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", mimeType);
      stream.pipe(res);
    } catch (error) {
      logger.error({
        layer: "controller",
        action: "INVOICE_DOWNLOAD_ERROR",
        userId,
        invoiceId,
        attachmentId,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  async importFromLocal(req: AuthRequest, res: Response, next: NextFunction) {
    const userId = requireUserId(req);
    const file = req.file;
    try {
      logger.info({
        layer: "controller",
        action: "INVOICE_IMPORT_LOCAL_ATTEMPT",
        userId,
        fileName: file?.originalname,
      });

      if (!file) throw new AppError("No file uploaded", 400);

      const invoice = await this.ocrService.createInvoiceFromBuffer(
        file.buffer,
        userId,
        file.originalname,
        file.mimetype
      );

      if (!invoice) {
        logger.error({
          layer: "controller",
          action: "INVOICE_IMPORT_LOCAL_ERROR",
          userId,
          error: "Failed to create invoice from file",
        });
        throw new AppError("Failed to create invoice from file", 500);
      }


      logger.info({
        layer: "controller",
        action: "INVOICE_IMPORT_LOCAL_SUCCESS",
        userId,
        invoiceId: invoice.id,
      });

      res.status(201).json({
        success: true,
        message: "Invoice imported from local file",
        data: invoice,
      });
    } catch (error) {
      logger.error({
        layer: "controller",
        action: "INVOICE_IMPORT_LOCAL_ERROR",
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  async importFromUrl(req: AuthRequest, res: Response, next: NextFunction) {
    const userId = requireUserId(req);
    const invoiceId = req.params.invoiceId;
    const { url } = req.body;
    try {
      logger.info({
        layer: "controller",
        action: "INVOICE_IMPORT_URL_ATTEMPT",
        userId,
        invoiceId,
        url,
      });

      if (!url) throw new AppError("Missing URL", 400);

      const invoice = await this.ocrService.updateInvoiceFromUrl(invoiceId, userId, url);

      logger.info({
        layer: "controller",
        action: "INVOICE_IMPORT_URL_SUCCESS",
        userId,
        invoiceId,
      });

      res.status(200).json({
        success: true,
        message: "Invoice updated from OCR",
        data: invoice,
      });
    } catch (error) {
      logger.error({
        layer: "controller",
        action: "INVOICE_IMPORT_URL_ERROR",
        userId,
        invoiceId,
        error: error instanceof Error ? error.message : String(error),
      });
      next(error);
    }
  }

  async importDataFromAttachment(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = requireUserId(req);
  const invoiceId = req.params.invoiceId;

  try {
    logger.info({
      layer: "controller",
      action: "INVOICE_IMPORT_ATTACHMENT_ATTEMPT",
      userId,
      invoiceId,
    });

    const invoice = await getInvoiceById(invoiceId, userId);
    const url = invoice?.attachments[0]?.url;

    if (!url) {
      logger.warn({
        layer: "controller",
        action: "INVOICE_IMPORT_ATTACHMENT_MISSING_URL",
        userId,
        invoiceId,
      });
      throw new AppError("Missing URL", 400);
    }

    const result = await this.ocrService.updateInvoiceFromUrl(invoiceId, userId, url);

    logger.info({
      layer: "controller",
      action: "INVOICE_IMPORT_ATTACHMENT_SUCCESS",
      userId,
      invoiceId,
    });

    res.status(200).json({
      success: true,
      message: "Invoice metadata updated from attachment",
      data: result,
    });
  } catch (error) {
    logger.error({
      layer: "controller",
      action: "INVOICE_IMPORT_ATTACHMENT_ERROR",
      userId,
      invoiceId,
      error: error instanceof Error ? error.message : String(error),
    });
    next(error);
  }
}}