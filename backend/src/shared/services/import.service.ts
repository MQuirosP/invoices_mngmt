import { FileFetcherService } from "@/shared/services/fileFetcher.service";
// import { OCRService } from "@/shared/services/ocr.service";
// import { TesseractOCRService } from "./tesseract-ocr.service";
import { OCRFactory } from "./ocr.factory";
// import Tesseract from "tesseract.js";

export class ImportService {
  private fetcher = new FileFetcherService();
  private ocr = OCRFactory.create("local")

  async extractFromUrl(url: string) {
    const buffer = await this.fetcher.fetchBuffer(url);
    return this.ocr.extractMetadataFromBuffer(buffer);
  }

  async extractFromBuffer(buffer: Buffer) {
    return this.ocr.extractMetadataFromBuffer(buffer);
  }
}