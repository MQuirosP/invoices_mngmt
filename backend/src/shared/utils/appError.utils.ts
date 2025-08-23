export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public cause?: Error;
  public meta?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    cause?: Error,
    meta?: Record<string, unknown>
  ) {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if (cause) {
      this.cause = cause;
    }

    if (meta) {
      this.meta = meta;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}