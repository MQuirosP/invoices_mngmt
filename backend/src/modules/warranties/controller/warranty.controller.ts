import { /*Request,*/ Response, NextFunction } from "express";
import { AppError } from "../../../shared/utils/AppError";
import {
  createWarranty,
  getWarrantyByInvoice,
  updateWarranty,
  deleteWarranty,
} from "../service/warranty.service";
import {
  createWarrantySchema,
  updateWarrantySchema,
} from "../schemas/warranty.schema";
import { AuthRequest } from "../../auth/middleware/auth.middleware";

export const create = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = createWarrantySchema.parse(req.body);
    const warranty = await createWarranty(data);
    res.status(201).json({
      success: true,
      message: "Warranty created successfully",
      data: warranty,
    });
  } catch (error) {
    next(error);
  }
};

export const findByInvoice = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invoiceId } = req.params;
    const warranty = await getWarrantyByInvoice(invoiceId);
    if (!warranty) throw new AppError("Warranty not found", 404);
    res.status(200).json({
      success: true,
      message: "Warranty found successfully",
      data: warranty,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invoiceId } = req.params;
    const data = updateWarrantySchema.parse(req.body);
    const warranty = await updateWarranty(invoiceId, data);
    res.status(200).json({
      success: true,
      message: "Warranty updated successfully",
      data: warranty,
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
    const { invoiceId } = req.params;
    const warranty = await deleteWarranty(invoiceId);
    res.status(200).json({
      success: true,
      message: "Warranty deleted successfully",
      data: warranty,
    });
  } catch (error) {
    next(error);
  }
};
