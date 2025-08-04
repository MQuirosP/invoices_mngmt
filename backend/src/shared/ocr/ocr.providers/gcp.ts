import vision from "@google-cloud/vision";
import { OCRProvider } from "@/shared/ocr/ocr.types";
import { extractMetadataFromText } from '@/shared/ocr/extractors/extractMetadata';
import { logOCR } from "@/shared/ocr/preprocessing";

const client = new vision.ImageAnnotatorClient();

export class GcpOCRProvider implements OCRProvider {
  async extract(buffer: Buffer) {
    logOCR("Using Google Cloud Vision");
    const [result] = await client.textDetection({ image: { content: buffer } });
    const text = result.fullTextAnnotation?.text;
    if (!text) throw new Error("No text was extracted");
    return extractMetadataFromText(text);
  }
}