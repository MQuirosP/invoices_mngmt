import { extractMetadataFromBuffer, extractMetadataFromUrl } from "@/shared/ocr";

export class ImportService {
  async extractFromUrl(url: string) {
    return extractMetadataFromUrl(url);
  }

  async extractFromBuffer(buffer: Buffer) {
    return extractMetadataFromBuffer(buffer);
  }
}