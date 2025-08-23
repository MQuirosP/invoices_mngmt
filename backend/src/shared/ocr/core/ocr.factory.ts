// shared/ocr/ocr.factory.ts
import { logger } from "@/shared/utils/logging/logger";
import { AppError } from "@/shared/utils/appError.utils";
import { OCRProvider } from "./ocr.types";
import { GcpOCRProvider } from "../providers/gcp";
import { TesseractOCRProvider } from "../providers/tesseract";

export class OCRFactory {
  static create(provider: string): OCRProvider {
    logger.info({
      layer: "middleware",
      module: "ocr",
      action: "OCR_PROVIDER_SELECTED",
      selected: provider,
      timestamp: new Date().toISOString(),
    });
    if (!provider || typeof provider !== "string") {
      throw new AppError(
        "OCR provider must be a non-empty string",
        400,
        true,
        undefined,
        {
          layer: "middleware",
          module: "ocr",
          provider,
          reason: "EMPTY_OR_INVALID_PROVIDER",
        }
      );
    }
    switch (provider) {
      case "gcp":
        return new GcpOCRProvider();
      case "tesseract":
        return new TesseractOCRProvider();
      default:
        throw new AppError(
          `Unsupported OCR provider: ${provider}`,
          400,
          true,
          undefined,
          {
            layer: "middleware",
            module: "ocr",
            provider,
            reason: "UNSUPPORTED_PROVIDER",
          }
        );
    }
  }
}
