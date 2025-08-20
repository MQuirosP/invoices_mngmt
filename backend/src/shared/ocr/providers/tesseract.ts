import Tesseract from "tesseract.js";
import { OCRProvider } from "../ocr.types";
import { extractMetadataFromText } from "@/shared/ocr/extractors/extractMetadata";
import { logOCR } from "@/shared/ocr/preprocessing";
import { logger } from "@/shared/utils/logger";

export class TesseractOCRProvider implements OCRProvider {
  async extract(buffer: Buffer) {
    logOCR("Using Tesseract.js");
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
