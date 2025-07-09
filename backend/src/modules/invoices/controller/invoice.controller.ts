import { AppError } from "./../../../shared/utils/AppError";
import { /*Request,*/ Response, NextFunction } from "express";
import { createInvoiceSchema } from "../schemas/invoice.schema";
import {
  createInvoice,
  getUserInvoices,
  getInvoiceById,
  deleteInvoiceById,
} from "../service/invoice.service";
import { AuthRequest } from "../../auth/middleware/auth.middleware";
import { uploadToCloudinary } from "../../../shared/utils/uploadToCloudinary";
import axios from "axios";
import { prisma } from "../../../config/prisma";

export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = createInvoiceSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) throw new AppError("User not authenticated", 401);

    // Crear factura sin archivos
    const invoice = await createInvoice(parsed, userId);

    // Manejar archivos si existen 
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
      message: invoices.length ? "Invoices retrieved successfully" : "No invoices found",
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

export const download = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const invoiceId = req.params.id;

    if (!userId) throw new AppError("Unauthorized", 401);
    if (!invoiceId) throw new AppError("Invoice ID required", 400);

    // Cargar invoice junto con attachments
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { attachments: true },
    });

    if (!invoice) throw new AppError("Invoice not found", 404);

    // Si no hay attachments
    if (!invoice.attachments || invoice.attachments.length === 0) {
      throw new AppError("No attachments found for this invoice", 404);
    }

    // Tomar el primer attachment (o cambiar lógica si quieres otro)
    const attachment = invoice.attachments[0];
    const fileUrl = attachment.url;
    const fileType = attachment.mimeType;

    const fileExtension = fileType.split("/")[1] || "bin"; // por ejemplo "application/pdf" -> "pdf"
    const fileName = `${invoice.title.replace(/\s+/g, "_")}.${fileExtension}`;

    // Descargar el archivo como stream
    const response = await axios.get(fileUrl, { responseType: "stream" });

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", response.headers["content-type"]);

    response.data.pipe(res);
  } catch (error) {
    next(error);
  }
};

