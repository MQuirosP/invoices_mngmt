import vision from "@google-cloud/vision";
import { OCRProvider } from "@/shared/ocr/core/ocr.types";
import { extractMetadataFromText } from "@/shared/ocr/extractors/extractMetadata";
import { logOCR } from "@/shared/ocr/core/preprocessing";
import { logger } from "@/shared/utils/logging/logger";

const client = new vision.ImageAnnotatorClient();

export class GcpOCRProvider implements OCRProvider {
  async extract(buffer: Buffer) {
    logOCR("Using Google Cloud Vision");
    const [result] = await client.textDetection({ image: { content: buffer } });
    const text = result.fullTextAnnotation?.text;
    if (!text) throw new Error("No text was extracted");
    logger.info({
      action: "OCR_TEXT_EXTRACTED",
      context: "GCP_OCR_PROVIDER",
      length: text.length,
    });

    return extractMetadataFromText(text);
  }
}
