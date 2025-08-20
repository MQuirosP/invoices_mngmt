import { logger } from "@/shared/utils/logger";
import { OCRFactory } from "../ocr.factory";
import { preprocessImage } from "../preprocessing";
import { FileFetcherService } from "../../services/fileFetcher.service";

export const extractMetadataFromUrl = async (url: string) => {
  const fileFetcher = new FileFetcherService();
  logger.info({
  action: "FILE_FETCH_INITIATED",
  context: "OCR_PIPELINE",
  sourceUrl: url,
});

  const buffer = await fileFetcher.fetchBuffer(url);
  return extractMetadataFromBuffer(buffer);
};

export const extractMetadataFromBuffer = async (buffer: Buffer) => {
  const provider = process.env.OCR_PROVIDER || "tesseract";
  const ocr = OCRFactory.create(provider);

  logger.info({
    action: "OCR_STARTED",
    context: "OCR_PIPELINE",
    provider,
  });

  const preprocessed = await preprocessImage(buffer);

  try {
    const result = await ocr.extract(preprocessed);

    logger.info({
      action: "OCR_SUCCESS",
      context: "OCR_PIPELINE",
      provider,
      itemCount: result.items?.length ?? 0,
    });

    return result;
  } catch (error) {
    logger.error({
      action: "OCR_FAILED",
      context: "OCR_PIPELINE",
      provider,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
};