import { FileFetcherService } from "@/shared/services/fileFetcher.service";
// import { OCRService } from "@/shared/services/ocr.service";
// import { TesseractOCRService } from "./tesseract-ocr.service";
import { OCRFactory, OCRProvider } from "./ocr.factory";
// import Tesseract from "tesseract.js";

const provider = process.env.OCR_PROVIDER || "local";


export class ImportService {
  private fetcher = new FileFetcherService();
  private ocr = OCRFactory.create(provider as OCRProvider);

  async extractFromUrl(url: string) {
    const buffer = await this.fetcher.fetchBuffer(url);
    return this.ocr.extractMetadataFromBuffer(buffer);
  }

  async extractFromBuffer(buffer: Buffer) {
    return this.ocr.extractMetadataFromBuffer(buffer);
  }
}