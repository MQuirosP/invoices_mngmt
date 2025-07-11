import { AppError } from "@/shared/utils/AppError.utils";
import { /*Request,*/ Response, NextFunction } from "express";
import { createInvoiceSchema } from "@/modules/invoices";
import {
  createInvoice,
  getUserInvoices,
  getInvoiceById,
  deleteInvoiceById,
  downloadAttachment,
  updateInvoiceFromOCR,
} from "./invoice.service";
import { AuthRequest } from "@/modules/auth/auth.middleware";
import { uploadToCloudinary } from "@/shared/utils/uploadToCloudinary";
import { prisma } from "@/config/prisma";

export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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
        const { url, type } = await uploadToCloudinary(
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
) => {
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
) => {
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
) => {
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
) => {
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
) => {
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
