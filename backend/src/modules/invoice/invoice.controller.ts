import { AppError } from "@/shared/utils/AppError.utils";
import { /*Request,*/ Response, NextFunction } from "express";
import { createInvoiceSchema } from "@/modules/invoice";
import {
  getUserInvoices,
  getInvoiceById,
  deleteInvoiceById,
  downloadAttachment,
  updateInvoiceFromUrlOcr,
  createInvoiceFromBufferOCR,
  createInvoiceWithFiles,
} from "./invoice.service";
import { AuthRequest } from "@/modules/auth/auth.types";
import { prisma } from "@/config/prisma";
import { requireUserId } from "@/shared/utils/requireUserId";
// import { AttachmentService } from "@/shared/services/attachment.service";
import { Role } from "@prisma/client";
import { logger } from "@/shared/utils/logger";

export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = createInvoiceSchema.parse(req.body);
    const userId = requireUserId(req);

    // Create invoice record
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      logger.warn({ userId, action: "CREATE_INVOICE_NO_FILES" });
    }

    logger.info({
      userId,
      action: "CREATE_INVOICE_ATTEMPT",
      metadata: parsed,
      fileCount: files?.length ?? 0,
    });

    const { invoice, uploadedFiles } = await createInvoiceWithFiles(
      parsed,
      userId,
      files
    );

    // if (files && files.length > 0) {
    //   for (const file of files) {
    //     await AttachmentService.uploadValidated(file, invoice.id, userId);
    //   }
    // }

    logger.info({
      userId,
      invoiceId: invoice.id,
      uploadedFiles,
      action: "CREATE_INVOICE_SUCCESS",
    });

    res.status(201).json({
      success: true,
      message: `Invoice created with ${uploadedFiles.length} attachment(s)`,
      data: invoice,
    });
  } catch (error) {
    logger.error({ error, action: "CREATE_INVOICE_ERROR" });
    next(error);
  }
};

export const list = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    logger.info({ userId, action: "LIST_INVOICES_ATTEMPT" });

    const invoices = await getUserInvoices(userId);
    logger.info({
      userId,
      count: invoices.length,
      action: "LIST_INVOICES_SUCCESS",
    });
    res.status(200).json({
      success: true,
      message: invoices.length
        ? "Invoices retrieved successfully"
        : "No invoices found",
      data: invoices,
    });
  } catch (error) {
    logger.error({ error, action: "LIST_INVOICES_ERROR" });
    next(error);
  }
};

export const show = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const invoiceId = req.params.id;

    logger.info({ userId, invoiceId, action: "SHOW_INVOICE_ATTEMPT" });

    if (!invoiceId)
      throw new AppError("Missing invoice ID in request params", 400);

    const invoice = await getInvoiceById(invoiceId, userId);
    if (!invoice) {
      logger.warn({ userId, invoiceId, action: "SHOW_INVOICE_NOT_FOUND" });
      throw new AppError("Invoice not found or access denied", 404);
    }

    logger.info({ userId, invoiceId, action: "SHOW_INVOICE_SUCCESS" });
    res.status(200).json({
      success: true,
      message: "Invoice retrieved successfully",
      data: invoice,
    });
  } catch (error) {
    logger.error({ error, action: "SHOW_INVOICE_ERROR" });
    next(error);
  }
};

export const remove = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const invoiceId = req.params.id;

    logger.info({ userId, invoiceId, action: "REMOVE_INVOICE_ATTEMPT" });
    if (!invoiceId)
      throw new AppError("Missing invoice ID in request params", 400);

    const deleted = await deleteInvoiceById(
      invoiceId,
      userId,
      req.user?.role as Role
    );

    if (!deleted) {
      logger.warn({ userId, invoiceId, action: "REMOVE_INVOICE_NOT_FOUND" });
      throw new AppError("Invoice not found or access denied", 404);
    }

    logger.info({ userId, invoiceId, action: "REMOVE_INVOICE_SUCCESS" });
    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
      data: deleted,
    });
  } catch (error) {
    logger.error({ error, action: "REMOVE_INVOICE_ERROR" });
    next(error);
  }
};

export const download = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const invoiceId = req.params.invoiceId;
    const attachmentId = req.params.attachmentId;

    if (!invoiceId)
      throw new AppError("Missing invoice ID in request params", 400);
    if (!attachmentId)
      throw new AppError("Missing attachment ID in request params", 400);

    const { stream, mimeType, fileName } = await downloadAttachment(
      userId,
      invoiceId,
      attachmentId
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", mimeType);

    stream.pipe(res);

    logger.info({ userId, invoiceId, attachmentId, action: "DOWNLOAD_ATTACHMENT_SUCCESS" });
    
  } catch (error) {
    logger.error({ error, action: "DOWNLOAD_ATTACHMENT_ERROR" });
    next(error);
  }
};

export const importFromLocal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const file = req.file;

    logger.info({
      userId,
      fileName: file?.originalname,
      mimetype: file?.mimetype,
      action: "IMPORT_LOCAL_ATTEMPT",
    });

    if (!file) return next(new AppError("Missing file in request", 400));

    const invoice = await createInvoiceFromBufferOCR(
      file.buffer,
      userId,
      file.originalname,
      file.mimetype
    );

    logger.info({
      userId,
      invoiceId: invoice?.id,
      action: "IMPORT_LOCAL_SUCCESS",
    });
    res.status(201).json({
      success: true,
      message: "Invoice imported from local file",
      data: invoice,
    });
  } catch (error) {
    logger.error({ error, action: "IMPORT_LOCAL_ERROR" });
    next(error);
  }
};

export const importDataFromAttachment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { invoiceId } = req.params;
    const userId = requireUserId(req);

    if (!invoiceId) {
      return next(new AppError("Missing invoice ID", 400));
    }

    logger.info({
      userId,
      invoiceId,
      action: "IMPORT_FROM_ATTACHMENT_ATTEMPT",
    });

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { attachments: true },
    });

    if (!invoice) {
      throw new AppError("Invoice not found for user or access denied", 404);
    }

    const attachment = invoice.attachments[0];
    if (!attachment) {
      return next(new AppError("No attachments found for this invoice", 404));
    }

    const updateInvoice = await updateInvoiceFromUrlOcr(
      invoiceId,
      userId,
      attachment.url
    );

    logger.info({
      userId,
      invoiceId,
      action: "IMPORT_FROM_ATTACHMENT_SUCCESS",
    });

    res.status(201).json({
      success: true,
      message: `Invoice ${invoiceId} imported successfully from Cloudinary`,
      data: updateInvoice,
    });
  } catch (error) {
    logger.error({ error, action: "IMPORT_FROM_ATTACHMENT_ERROR" });
    next(error);
  }
};

export const importFromUrl = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { url } = req.body;
    const { invoiceId } = req.params;
    const userId = requireUserId(req);

    if (!invoiceId) return next(new AppError("Missing invoice ID", 400));
    if (!url) return next(new AppError("Missing URL in request body", 400));

    logger.info({ userId, invoiceId, url, action: "IMPORT_FROM_URL_ATTEMPT" });

    const updateInvoice = await updateInvoiceFromUrlOcr(invoiceId, userId, url);

    logger.info({ userId, invoiceId, url, action: "IMPORT_FROM_URL_SUCCESS" });

    res.status(201).json({
      success: true,
      message: "Invoice imported from Cloudinary URL",
      data: updateInvoice,
    });
  } catch (error) {
    logger.error({ error, action: "IMPORT_FROM_URL_ERROR" });
    next(error);
  }
};
