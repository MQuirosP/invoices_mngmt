import {
  extractMetadataFromBuffer,
  extractMetadataFromUrl,
} from "@/shared/ocr/extractors/metadataExtractor";
import { logger } from "@/shared/utils/logger";
import { AppError } from "@/shared/utils/AppError";

export class ImportService {
  async extractFromUrl(url: string) {
    logger.info({
      action: "IMPORT_FROM_URL",
      context: "IMPORT_SERVICE",
      url,
    });

    try {
      return await extractMetadataFromUrl(url);
    } catch (error: any) {
      logger.error({
        action: "IMPORT_URL_FAILED",
        context: "IMPORT_SERVICE",
        url,
        error,
      });
      throw new AppError("Failed to extract metadata from URL", 500);
    }
  }

  async extractFromBuffer(buffer: Buffer) {
    logger.info({
      action: "IMPORT_FROM_BUFFER",
      context: "IMPORT_SERVICE",
      bufferSize: buffer.length,
    });

    try {
      return await extractMetadataFromBuffer(buffer);
    } catch (error: any) {
      logger.error({
        action: "IMPORT_BUFFER_FAILED",
        context: "IMPORT_SERVICE",
        bufferSize: buffer.length,
        error,
      });
      throw new AppError("Failed to extract metadata from buffer", 500);
    }
  }
}
