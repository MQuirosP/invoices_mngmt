import {
  extractMetadataFromBuffer,
  extractMetadataFromUrl,
} from "@/shared/ocr/core/ocr.pipeline";
import { logger } from "@/shared/utils/logging/logger";
import { AppError } from "@/shared/utils/appError.utils";

export class ImportService {
  async extractFromUrl(url: string) {
    const timestamp = new Date().toISOString();

    logger.info({
      layer: "service",
      module: "import",
      action: "IMPORT_FROM_URL",
      url,
      timestamp,
    });

    try {
      return await extractMetadataFromUrl(url);
    } catch (error: any) {
      logger.error({
        layer: "service",
        module: "import",
        action: "IMPORT_URL_FAILED",
        url,
        error: error instanceof Error ? error.message : String(error),
        timestamp,
      });

      throw new AppError("Failed to extract metadata from URL", 500, true, error, {
        layer: "service",
        module: "import",
        reason: "EXTRACTION_ERROR_FROM_URL",
        url,
        timestamp,
      });
    }
  }

  async extractFromBuffer(buffer: Buffer) {
    const timestamp = new Date().toISOString();

    logger.info({
      layer: "service",
      module: "import",
      action: "IMPORT_FROM_BUFFER",
      bufferSize: buffer.length,
      timestamp,
    });

    try {
      return await extractMetadataFromBuffer(buffer);
    } catch (error: any) {
      logger.error({
        layer: "service",
        module: "import",
        action: "IMPORT_BUFFER_FAILED",
        bufferSize: buffer.length,
        error: error instanceof Error ? error.message : String(error),
        timestamp,
      });

      throw new AppError("Failed to extract metadata from buffer", 500, true, error, {
        layer: "service",
        module: "import",
        reason: "EXTRACTION_ERROR_FROM_BUFFER",
        bufferSize: buffer.length,
        timestamp,
      });
    }
  }
}