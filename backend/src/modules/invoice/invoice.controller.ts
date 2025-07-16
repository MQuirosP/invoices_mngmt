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
import { AuthRequest } from "@/modules/auth/auth.middleware";
import { prisma } from "@/config/prisma";
import { requireUserId } from "@/shared/utils/requireUserId";
import { AttachmentService } from "@/shared/services/attachment.service";
import { Role } from "@prisma/client";

export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = createInvoiceSchema.parse(req.body);
    const userId = requireUserId(req);
    if (!userId) throw new AppError("User not authenticated", 401);

    // Create invoice record
    const files = req.files as Express.Multer.File[] | undefined;
    const { invoice, uploadedFiles } = await createInvoiceWithFiles(
      parsed,
      userId,
      files
    );

    if (files && files.length > 0) {
      for (const file of files) {
        await AttachmentService.uploadValidated(file, invoice.id, userId);
      }
    }

    res.status(201).json({
      success: true,
      message: `Invoice created with ${uploadedFiles.length} attachment(s)`,
      data: invoice,
    });
  } catch (error) {
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
    if (!userId) throw new AppError("User not authenticated", 401);

    const invoices = await getUserInvoices(userId);
    res.status(200).json({
      success: true,
      message: invoices.length
        ? "Invoices retrieved successfully"
        : "No invoices found",
      data: invoices,
    });
  } catch (error) {
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

    if (!userId) throw new AppError("Unauthorized", 401);
    if (!invoiceId) throw new AppError("Invoice ID required", 400);

    const invoice = await getInvoiceById(invoiceId, userId);

    if (!invoice) throw new AppError("Invoice not found", 404);

    res.status(200).json({
      success: true,
      message: "Invoice retrieved successfully",
      data: invoice,
    });
  } catch (error) {
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

    if (!userId) throw new AppError("Unauthorized", 401);
    if (!invoiceId) throw new AppError("Invoice ID required", 400);

    const deleted = await deleteInvoiceById(
      invoiceId,
      userId,
      req.user?.role as Role
    );

    if (!deleted) throw new AppError("Invoice not found", 404);

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
      data: deleted,
    });
  } catch (error) {
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

    if (!userId) throw new AppError("Unauthorized", 401);
    if (!invoiceId || !attachmentId) throw new AppError("Missing IDs", 400);

    const { stream, mimeType, fileName } = await downloadAttachment(
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
};

export const importFromLocal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = requireUserId(req);
    const file = req.file;
    if (!file || !userId) {
      res.status(400).json({ message: "Missing file or user ID" });
      return;
    }
    const invoice = await createInvoiceFromBufferOCR(
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
};

export const importDataFromAttachment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { invoiceId } = req.params;
    const userId = requireUserId(req);

    if (!invoiceId || !userId) {
      res.status(400).json({ message: "Missing invoice ID or user ID" });
      return;
    }

    // Asure invoice belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
      include: {
        attachments: true,
      },
    });

    if (!invoice) {
      res.status(404).json({ message: "Invoice not found or access denied" });
      return;
    }

    const attachment = invoice.attachments[0];
    if (!attachment) {
      res
        .status(404)
        .json({ message: "No attachments found for this invoice" });
      return;
    }

    const updateInvoice = await updateInvoiceFromUrlOcr(
      invoiceId,
      userId,
      attachment.url
    );

    res.status(201).json({
      success: true,
      message: "Invoice imported from Cloudinary URL",
      data: updateInvoice,
    });
  } catch (error) {
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

    if (!url || !userId || !invoiceId) {
      res.status(400).json({ message: "Missing URL, invoice ID or user ID" });
      return;
    }

    const updateInvoice = await updateInvoiceFromUrlOcr(invoiceId, userId, url);

    res.status(201).json({
      success: true,
      message: "Invoice imported from Cloudinary URL",
      data: updateInvoice,
    });
  } catch (error) {
    next(error);
  }
};
