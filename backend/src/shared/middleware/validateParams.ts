import { Request, Response, NextFunction } from "express";
import { AppError } from "@/shared/utils/AppError.utils";

export const validateParams = (params: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const missing = params.filter((p) => !req.params[p]);
    if (missing.length > 0) {
      throw new AppError(`Missing required parameters: ${missing.join(", ")}`, 400);
    }
    next();
  };
};
