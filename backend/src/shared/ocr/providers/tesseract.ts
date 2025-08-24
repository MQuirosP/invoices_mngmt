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
    const {
      data: { text },
    } = await worker.recognize(buffer);
    await worker.terminate();
    if (!text) throw new Error("No text was extracted");
    logger.info({
      action: "OCR_TEXT_EXTRACTED",
      context: "TESSERACT_OCR_PROVIDER",
      length: text.length,
    });
    return extractMetadataFromText(text);
  }
}
