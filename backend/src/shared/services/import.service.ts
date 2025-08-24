import {
  OCRProcessor,
} from "@/shared/ocr/core/ocr.pipeline";
import { logger } from "@/shared/utils/logging/logger";
import { AppError } from "@/shared/utils/appError.utils";
import { ExtractedInvoiceMetadata } from "../ocr/core/ocr.types";
import { FileFetcherService } from "./fileFetcher.service";
import { validateRealMime } from "../utils/file/validateRealMime";

export class ImportService {

  async extractAndRoute(input: {
  buffer?: Buffer;
  url?: string;
  declaredMime?: string;
}): Promise<ExtractedInvoiceMetadata> {
  const buffer = input.buffer ?? await new FileFetcherService().fetchBuffer(input.url!);

  const { mime } = await validateRealMime(
    buffer,
    input.declaredMime ?? "application/octet-stream",
    input.url
  );

  switch (mime) {
    case "application/xml":
    case "text/xml":
      return this.parseXmlMetadata(buffer);
    case "application/pdf":
      return this.extractPdfMetadata(buffer);
    case "image/jpeg":
    case "image/png":
      return OCRProcessor(buffer);
    default:
      throw new AppError(`Unsupported MIME type: ${mime}`, 415);
  }
}

async parseXmlMetadata (buffer: Buffer): Promise<ExtractedInvoiceMetadata> {
  return {} as ExtractedInvoiceMetadata;
};

async extractPdfMetadata (buffer: Buffer): Promise<ExtractedInvoiceMetadata> {
  return {} as ExtractedInvoiceMetadata;
};

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
      return await OCRProcessor(buffer);
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