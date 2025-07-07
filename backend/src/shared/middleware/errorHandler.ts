import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

interface CustomError extends Error {
    statusCode?: number;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        statusCode,
        error: message
    });
};