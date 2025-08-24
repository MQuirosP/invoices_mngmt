import { logger } from "@/shared/utils/logging/logger";
import { OCRFactory } from "./ocr.factory";
import { preprocessImage } from "./preprocessing";
import { AppError } from "@/shared";


export const OCRProcessor = async (buffer: Buffer) => {
  const provider = process.env.OCR_PROVIDER || "tesseract";
  const ocr = OCRFactory.create(provider);

  logger.info({
    layer: "middleware",
    module: "ocr",
    action: "OCR_STARTED",
    provider,
    timestamp: new Date().toISOString(),
  });

  const preprocessed = await preprocessImage(buffer);

  try {
    const result = await ocr.extract(preprocessed);

    logger.info({
      layer: "middleware",
      module: "ocr",
      action: "OCR_SUCCESS",
      provider,
      itemCount: result.items?.length ?? 0,
      timestamp: new Date().toISOString(),
    });

    return result;
  } catch (error) {
    logger.error({
      layer: "middleware",
      module: "ocr",
      action: "OCR_FAILED",
      provider,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    throw new AppError(error instanceof Error ? error.message : String(error), 500, true);
  }
};
