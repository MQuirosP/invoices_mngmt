// shared/ocr/ocr.factory.ts
import { OCRProvider } from "./ocr.types";
import { GcpOCRProvider } from "./ocr.providers/gcp";
import { TesseractOCRProvider } from "./ocr.providers/tesseract";

export class OCRFactory {
  static create(provider: string): OCRProvider {
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