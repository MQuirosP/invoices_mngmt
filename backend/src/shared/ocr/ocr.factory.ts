// shared/ocr/ocr.factory.ts
import { OCRProvider } from "./ocr.types";
import { GcpOCRProvider } from "./providers/gcp";
import { TesseractOCRProvider } from "./providers/tesseract";
import { logger } from "@/shared/utils/logger";
import { AppError } from "@/shared/utils/AppError";

export class OCRFactory {
  static create(provider: string): OCRProvider {
    logger.info({
      action: "OCR_PROVIDER_SELECTED",
      context: "OCR_FACTORY",
      selected: provider,
    });
    if (!provider || typeof provider !== "string") {
      throw new AppError(
        "OCR provider must be a non-empty string",
        400,
        true,
        undefined,
        {
          context: "OCR_FACTORY",
          provider,
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
            context: "OCR_FACTORY",
            provider,
          }
        );
    }
  }
}
