import { AppError } from "@/shared/utils/AppError.utils";
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
  const { fileTypeFromBuffer } = await import("file-type");
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    logger.warn({
      message: "Failed to detect actual MIME type",
      declaredMime,
      filename,
      context: "VALIDATE_REAL_MIME",
    });
    throw new AppError("Unable to identify the actual MIME type", 422);
  }

  const metadata = mimeMetadataMap[detected.mime];
  if (!metadata) {
    logger.warn({
      message: "Detected MIME type is not allowed",
      detectedMime: detected.mime,
      filename,
      context: "VALIDATE_REAL_MIME",
    });
    throw new AppError("MIME type not allowed", 415);
  }

  if (!metadata.safe) {
    logger.warn({
      message: "Detected MIME type is marked as unsafe",
      detectedMime: detected.mime,
      label: metadata.label,
      filename,
      context: "VALIDATE_REAL_MIME",
    });
    throw new AppError("Unsafe MIME type", 415);
  }

  const isMatch = declaredMime === detected.mime;
  if (!isMatch) {
    logger.warn({
      message: "Declared MIME does not match actual MIME",
      declaredMime,
      detectedMime: detected.mime,
      label: metadata.label,
      filename,
      context: "VALIDATE_REAL_MIME",
    });
    throw new AppError(
      `Invalid MIME type. Expected ${declaredMime}, but detected ${detected.mime}`,
      415
    );
  }

  return {
    mime: detected.mime,
    ext: metadata.ext,
  };
};
