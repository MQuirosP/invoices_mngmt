import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
/**
 * Middleware to handle errors in the application.
 * It captures operational errors and sends a structured response.
 *
 * @param {AppError} err - The error object containing error details.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 */
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