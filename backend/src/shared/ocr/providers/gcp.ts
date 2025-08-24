import vision from "@google-cloud/vision";
import { OCRProvider } from "@/shared/ocr/core/ocr.types";
import { extractMetadataFromText } from "@/shared/ocr/extractors/extractMetadata";
import { logger } from "@/shared/utils/logging/logger";
import { extractWordsFromAnnotation, reconstructLinesFromWords } from "../../utils/reconstructLinesFromAnnotation";

const client = new vision.ImageAnnotatorClient();

export class GcpOCRProvider implements OCRProvider {
  async extract(buffer: Buffer) {
    logger.info({
      action: "OCR_ENGINE_SELECTED",
      context: "GCP_OCR_PROVIDER",
      msg: "Using Google Cloud Vision",
    });

    const [result] = await client.documentTextDetection({ image: { content: buffer } });
    const annotation = result.fullTextAnnotation;
    if (!annotation) throw new Error("No fullTextAnnotation found");

    const words = extractWordsFromAnnotation(annotation);
    const lines = reconstructLinesFromWords(words);

    logger.info({
      action: "OCR_TEXT_RECONSTRUCTED",
      context: "GCP_OCR_PROVIDER",
      lineCount: lines.length,
    });

    return extractMetadataFromText(lines.join("\n"));
  }
}