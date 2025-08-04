// shared/ocr/ocr.providers/tesseract.ts
import Tesseract from "tesseract.js";
import { OCRProvider } from "../ocr.types";
import { extractMetadataFromText } from "../extractors/extractMetadata";
import { logOCR } from "../preprocessing";

export class TesseractOCRProvider implements OCRProvider {
  async extract(buffer: Buffer) {
    logOCR("Usando Tesseract.js");
    const worker = await Tesseract.createWorker(["spa"]);
    await worker.reinitialize("spa");
    await worker.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK });
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    if (!text) throw new Error("No se extrajo texto");
    return extractMetadataFromText(text);
  }
}