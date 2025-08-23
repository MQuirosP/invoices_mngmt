import { AppError } from "@/shared/utils/appError.utils";
import { mimeMetadataMap } from "@/shared/constants/mimeExtensionMap";
import { logger } from "@/shared";

/**
 * Checks whether the declared MIME matches the actual MIME of the file
 */
export const validateRealMime = async (
  buffer: Buffer,
  declaredMime: string,
  filename?: string
): Promise<{ mime: string; ext: string }> => {
  const timestamp = new Date().toISOString();
  const { fileTypeFromBuffer } = await import("file-type");
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    logger.warn({
      layer: "shared",
      module: "validate-mime",
      action: "MIME_DETECTION_FAILED",
      declaredMime,
      filename,
      reason: "NO_MIME_DETECTED",
      timestamp,
    });

    throw new AppError("Unable to identify the actual MIME type", 422, true, undefined, {
      layer: "shared",
      module: "validate-mime",
      reason: "NO_MIME_DETECTED",
      declaredMime,
      filename,
      timestamp,
    });
  }

  const metadata = mimeMetadataMap[detected.mime];
  if (!metadata) {
    logger.warn({
      layer: "shared",
      module: "validate-mime",
      action: "MIME_NOT_ALLOWED",
      detectedMime: detected.mime,
      filename,
      reason: "UNSUPPORTED_MIME",
      timestamp,
    });

    throw new AppError("MIME type not allowed", 415, true, undefined, {
      layer: "shared",
      module: "validate-mime",
      reason: "UNSUPPORTED_MIME",
      detectedMime: detected.mime,
      filename,
      timestamp,
    });
  }

  if (!metadata.safe) {
    logger.warn({
      layer: "shared",
      module: "validate-mime",
      action: "MIME_UNSAFE",
      detectedMime: detected.mime,
      label: metadata.label,
      filename,
      reason: "UNSAFE_MIME",
      timestamp,
    });

    throw new AppError("Unsafe MIME type", 415, true, undefined, {
      layer: "shared",
      module: "validate-mime",
      reason: "UNSAFE_MIME",
      detectedMime: detected.mime,
      filename,
      timestamp,
    });
  }

  const isMatch = declaredMime === detected.mime;
  if (!isMatch) {
    logger.warn({
      layer: "shared",
      module: "validate-mime",
      action: "MIME_MISMATCH",
      declaredMime,
      detectedMime: detected.mime,
      label: metadata.label,
      filename,
      reason: "DECLARED_MIME_MISMATCH",
      timestamp,
    });

    throw new AppError(
      `Invalid MIME type. Expected ${declaredMime}, but detected ${detected.mime}`,
      415,
      true,
      undefined,
      {
        layer: "shared",
        module: "validate-mime",
        reason: "DECLARED_MIME_MISMATCH",
        declaredMime,
        detectedMime: detected.mime,
        filename,
        timestamp,
      }
    );
  }

  return {
    mime: detected.mime,
    ext: metadata.ext,
  };
};