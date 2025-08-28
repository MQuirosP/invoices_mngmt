import Tesseract from "tesseract.js";
import { OCRProvider } from "../core/ocr.types";
import { extractMetadataFromText } from "@/shared/ocr/extractors/semanticExtractor";
import { logger } from "@/shared/utils/logging/logger";

export class TesseractOCRProvider implements OCRProvider {
  async extract(buffer: Buffer) {
    logger.info({
      action: "OCR_ENGINE_SELECTED",
      context: "TESSERACT_OCR_PROVIDER",
      msg: "Using Tesseract.js",
    });

    const worker = await Tesseract.createWorker(["spa"]);
    await worker.reinitialize("spa");
    await worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
    });

    const result = await worker.recognize(buffer);
    await worker.terminate();

    const text = result.data.text;
    const words = (result.data as any).words ?? [];

    if (!text) throw new Error("No text was extracted");

    const avgConfidence =
      words.length > 0
        ? words.reduce((sum: number, word: { confidence: number }) => sum + word.confidence, 0) / words.length
        : 1;

    logger.info({
      action: "OCR_TEXT_EXTRACTED",
      context: "TESSERACT_OCR_PROVIDER",
      length: text.length,
      confidence: avgConfidence,
    });

    return extractMetadataFromText(text, avgConfidence);
  }
}