import {
  extractMetadataFromBuffer,
  extractMetadataFromUrl,
} from "@/shared/ocr";
import { logger } from "@/shared/utils/logger";

export class ImportService {
  async extractFromUrl(url: string) {
    logger.info({
      action: "IMPORT_FROM_URL",
      context: "IMPORT_SERVICE",
      url,
    });

    return extractMetadataFromUrl(url);
  }

  async extractFromBuffer(buffer: Buffer) {
    logger.info({
      action: "IMPORT_FROM_BUFFER",
      context: "IMPORT_SERVICE",
      bufferSize: buffer.length,
    });

    return extractMetadataFromBuffer(buffer);
  }
}
