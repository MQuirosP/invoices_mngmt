// shared/ocr/ocr.providers/gcp.ts
import vision from "@google-cloud/vision";
import { OCRProvider } from "../ocr.types";
import { extractMetadataFromText, logOCR } from "../extractors/extractMetadata";

const client = new vision.ImageAnnotatorClient();

export class GcpOCRProvider implements OCRProvider {
  async extract(buffer: Buffer) {
    logOCR("Usando Google Cloud Vision");
    const [result] = await client.textDetection({ image: { content: buffer } });
    const text = result.fullTextAnnotation?.text;
    if (!text) throw new Error("No se extrajo texto");
    return extractMetadataFromText(text);
  }
}