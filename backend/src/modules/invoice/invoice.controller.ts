import { AppError } from "@/shared/utils/AppError.utils";
import { /*Request,*/ Response, NextFunction } from "express";
import { createInvoiceSchema } from "@/modules/invoice";
import {
  createInvoice,
  getUserInvoices,
  getInvoiceById,
  deleteInvoiceById,
  downloadAttachment,
  updateInvoiceFromOCR,
} from "./invoice.service";
import { ImportService } from "@/shared/services/import.service";
import { AuthRequest } from "@/modules/auth/auth.middleware";
import { prisma } from "@/config/prisma";
import { CloudinaryService } from '../../shared/services/cloudinary.service';

const importService = new ImportService();
const cloudinary = new CloudinaryService()

export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = createInvoiceSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) throw new AppError("User not authenticated", 401);

    // Create record without file
    const invoice = await createInvoice(parsed, userId);

    // Handle files if exist
    const files = req.files as Express.Multer.File[] | undefined;

    if (files && files.length > 0) {
      for (const file of files) {
        const { url, type } = await cloudinary.upload(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        await prisma.attachment.create({
          data: {
            invoiceId: invoice.id,
            url,
            mimeType: type,
            fileName: file.originalname,
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Invoice created successfully with attachments",
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
    const userId = req.user?.id;
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
    const userId = req.user?.id;
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

export const extractFromAttachment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const invoiceId = req.params.invoiceId;
    const { url } = req.body;

    if (!userId || !invoiceId || !url) {
      throw new AppError("Faltan datos requeridos", 400);
    }

    const updated = await updateInvoiceFromOCR(invoiceId, userId, url);

    res.status(200).json({
      success: true,
      message: "Invoice updated from OCR successfully",
      data: updated,
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
    const userId = req.user?.id;
    const invoiceId = req.params.id;

    if (!userId) throw new AppError("Unauthorized", 401);
    if (!invoiceId) throw new AppError("Invoice ID required", 400);

    const deleted = await deleteInvoiceById(invoiceId, userId);

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
    const userId = req.user?.id;
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
    const userId = req.user?.id;
    const file = req.file;

    if (!file || !userId) {
      res.status(400).json({ message: "Missing file or user ID" });
      return;
    }

    const invoice = await importService.importFromBuffer(
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

export const importFromUrl = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { url } = req.body;
    const { invoiceId } = req.params;

    const userId = req.user?.id || "";

    if (!url || !userId || !invoiceId) {
      res.status(400).json({ message: "Missing URL, invoice ID or user ID" });
      return;
    }

    const invoice = await importService.updateFromUrl(url, invoiceId);

    res.status(201).json({
      success: true,
      message: "Invoice imported from Cloudinary URL",
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

