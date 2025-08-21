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
    try {
      const userId = requireUserId(req);
      const parsed = createInvoiceSchema.parse(req.body);
      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || files.length === 0) {
        logger.warn({ userId, action: "INVOICE_CREATE_NO_FILES" });
      }

      const invoice = await createInvoice(parsed, userId);
      const uploads = files?.length
        ? await this.fileService.uploadFiles(userId, invoice.id, files)
        : [];

      logger.info({ msg: "Invoice created", invoiceId: invoice.id, userId });

      res.status(201).json({
        success: true,
        message: `Invoice created with ${uploads.length} attachment(s)`,
        data: await getInvoiceById(invoice.id, userId),
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const invoices = await getUserInvoices(userId);
      res.status(200).json({ success: true, data: invoices });
    } catch (error) {
      next(error);
    }
  }

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const invoiceId = req.params.invoiceId;
      const invoice = await getInvoiceById(invoiceId, userId);
      res.status(200).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const invoiceId = req.params.id;
      const userRole = req.user?.role as Role;

      const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, userId },
        include: { attachments: true },
      });

      if (!invoice) throw new AppError("Invoice not found", 404);

      await this.fileService.deleteAttachments(userId, invoiceId);
      const deletedInvoice = await deleteInvoiceById(invoiceId, userId, userRole);

      logger.info({ msg: "Invoice deleted", invoiceId, userId });

      res.status(200).json({
        success: true,
        message: "Invoice deleted",
        data: deletedInvoice,
      });
    } catch (error) {
      next(error);
    }
  }

  async download(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const { invoiceId, attachmentId } = req.params;
      const { stream, mimeType, fileName } = await this.fileService.downloadAttachment(
        userId,
        invoiceId,
        attachmentId
      );

      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", mimeType);
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  async importFromLocal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const file = req.file;
      if (!file) throw new AppError("No file uploaded", 400);

      const invoice = await this.ocrService.createInvoiceFromBuffer(
        file.buffer,
        userId,
        file.originalname,
        file.mimetype
      );

      res.status(201).json({
        success: true,
        message: "Invoice imported from local file",
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  async importFromUrl(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const invoiceId = req.params.invoiceId;
      const { url } = req.body;
      if (!url) throw new AppError("Missing URL", 400);

      const invoice = await this.ocrService.updateInvoiceFromUrl(invoiceId, userId, url);

      res.status(200).json({
        success: true,
        message: "Invoice updated from OCR",
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  async importDataFromAttachment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = requireUserId(req);
      const invoiceId = req.params.invoiceId;
      const invoice = await getInvoiceById(invoiceId, userId);
      const url = invoice?.attachments[0]?.url;

      if (!url) throw new AppError("Missing URL", 400);

      const result = await this.ocrService.updateInvoiceFromUrl(invoiceId, userId, url);

      res.status(200).json({
        success: true,
        message: "Invoice metadata updated from attachment",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}