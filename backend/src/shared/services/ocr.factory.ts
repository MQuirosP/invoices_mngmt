// services/ocr.factory.ts
import { OCRService } from "./ocr.service"; // Tu servicio existente de GCP
import { TesseractOCRService } from "./tesseract-ocr.service"; // El nuevo servicio de Tesseract.js

export type OCRProvider = "gcp" | "aws" | "local" | "tesseract"; // Agrega 'tesseract' al tipo

export class OCRFactory {
  static create(provider: OCRProvider = "gcp") {
    switch (provider) {
      case "gcp":
        return new OCRService();
      case "tesseract": // Nuevo caso para Tesseract.js
      // case "aws":
      //   return new AwsOCRService();
      case "local":
        return new TesseractOCRService();
      default:
        throw new Error("Unsupported OCR provider");
    }
  }
}