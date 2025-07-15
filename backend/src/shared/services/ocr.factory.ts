import { OCRService } from "./ocr.service";

export type OCRProvider = "gcp" | "aws" | "local";

export class OCRFactory {
  static create(provider: OCRProvider = "gcp") {
    switch (provider) {
      case "gcp":
        return new OCRService();
      // case "aws":
      //   return new AwsOCRService();
      // case "local":
      //   return new LocalOCRService();
      default:
        throw new Error("Unsupported OCR provider");
    }
  }
}