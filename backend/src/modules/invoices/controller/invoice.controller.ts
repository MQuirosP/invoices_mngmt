import { AppError } from "./../../../shared/utils/AppError";
import { /*Request,*/ Response, NextFunction } from "express";
import { createInvoiceSchemna } from "../schemas/invoice.schema";
import {
  createInvoice,
  getUserInvoices,
  getInvoiceById,
  deleteInvoiceById,
} from "../service/invoice.service";
import { AuthRequest } from "../../auth/middleware/auth.middleware";
import { uploadToCloudinary } from "../../../shared/utils/uploadToCloudinary";

export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = createInvoiceSchemna.parse(req.body);
    const userId = req.user?.id;
    if (!userId) throw new AppError("User not authenticated", 401);
    console.log(parsed);
    const file = req.file;
    if (!file) throw new AppError("File is required", 400);

    const { url, type } = await uploadToCloudinary(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const invoice = await createInvoice(
      {
        ...parsed,
        fileUrl: url,
        fileType: type,
      },
      userId
    );

    res.status(201).json({
      sucess: true,
      message: "Invoice created successfully",
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
      message: "Invoices retrieved successfully",
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
