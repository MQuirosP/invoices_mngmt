// shared/ocr/ocr.factory.ts
import { OCRProvider } from "./ocr.types";
import { GcpOCRProvider } from "./ocr.providers/gcp";
import { TesseractOCRProvider } from "./ocr.providers/tesseract";
import { logger } from "@/shared/utils/logger";

export class OCRFactory {
  static create(provider: string): OCRProvider {
    logger.info({
      action: "OCR_PROVIDER_SELECTED",
      context: "OCR_FACTORY",
      selected: provider
    });

    switch (provider) {
      case "gcp":
        return new GcpOCRProvider();
      case "tesseract":
        return new TesseractOCRProvider();
      default:
        throw new Error(`Unsupported OCR provider: ${provider}`);
    }
  }
}