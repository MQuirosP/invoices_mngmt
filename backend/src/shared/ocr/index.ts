import { OCRFactory } from "./ocr.factory";
import { preprocessImage, fetchBuffer, logOCR } from "./ocr.utils";

export const extractMetadataFromUrl = async (url: string) => {
  const buffer = await fetchBuffer(url);
  return extractMetadataFromBuffer(buffer);
};

export const extractMetadataFromBuffer = async (buffer: Buffer) => {
  const provider = process.env.OCR_PROVIDER || "tesseract";
  const ocr = OCRFactory.create(provider);
  const preprocessed = await preprocessImage(buffer);
  logOCR("OCR iniciado", { provider });
  return ocr.extract(preprocessed);
};