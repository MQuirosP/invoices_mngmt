import { FileFetcherService } from "@/shared/services/fileFetcher.service";
import { OCRService } from "@/shared/services/ocr.service";

export class ImportService {
  private fetcher = new FileFetcherService();
  private ocr = new OCRService();

  async extractFromUrl(url: string) {
    const buffer = await this.fetcher.fetchBuffer(url);
    return this.ocr.extractMetadataFromBuffer(buffer);
  }

  async extractFromBuffer(buffer: Buffer) {
    return this.ocr.extractMetadataFromBuffer(buffer);
  }
}