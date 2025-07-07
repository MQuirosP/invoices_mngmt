import { AppError } from "./../../../shared/utils/AppError";
import { Request, Response, NextFunction } from "express";
import { createInvoiceSchemna } from "../schemas/invoice.schema";
import { createInvoice, getUserInvoices } from "../service/invoice.service";
import { AuthRequest } from "../../auth/middleware/auth.middleware";

export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = createInvoiceSchemna.parse(req.body);
    const userId = req.user?.id;
    if (!userId) throw new AppError("User not authenticated", 401);

    const invoice = await createInvoice(parsed, userId);
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
