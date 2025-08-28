import { logger } from "@/shared/utils/logging/logger";
import { OCRFactory } from "./ocr.factory";
import { preprocessImage } from "./preprocessing";
import { AppError } from "@/shared";
// import { extractMetadataFromText } from "./extractors";
import { validateSemanticMetadata } from "../validateSemanticMetadata";

export const OCRProcessor = async (buffer: Buffer) => {
  const primaryProvider = process.env.OCR_PROVIDER || "gcp";
  const fallbackEnabled = (process.env.OCR_FALLBACK_ENABLED || "true") === "true";
  const confidenceThreshold = parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD || "0.55");

  const primary = OCRFactory.create(primaryProvider);
  const preprocessed = await preprocessImage(buffer);

  try {
    let result = await primary.extract(preprocessed);

    // ① Validación semántica primaria
    if (!validateSemanticMetadata(result) ||
        (fallbackEnabled && (result.confidence ?? 1) < confidenceThreshold)) {
      logger.warn({
        layer: "middleware",
        module: "ocr",
        action: "OCR_VALIDATION_OR_CONFIDENCE_LOW",
        provider: primaryProvider,
        confidence: result.confidence,
        threshold: confidenceThreshold,
      });

      // Fallback: reprocesar imagen con parámetros más agresivos
      const altPreprocessed = await preprocessImage(buffer, { enhanceContrast: true, upscale: true });
      const fallback = OCRFactory.create(primaryProvider === "gcp" ? "tesseract" : "gcp");
      const fallbackResult = await fallback.extract(altPreprocessed);

      // Escoge el mejor por confianza
      result = (fallbackResult.confidence ?? 0) > (result.confidence ?? 0)
        ? fallbackResult
        : result;
    }

    return result;
  } catch (error) {
    if (fallbackEnabled) {
      logger.error({
        layer: "middleware",
        module: "ocr",
        action: "OCR_PRIMARY_FAILED",
        provider: primaryProvider,
        error: error instanceof Error ? error.message : String(error),
      });

      const fallback = OCRFactory.create(primaryProvider === "gcp" ? "tesseract" : "gcp");
      return fallback.extract(preprocessed);
    }

    throw new AppError(
      error instanceof Error ? error.message : String(error),
      500,
      true
    );
  }
};