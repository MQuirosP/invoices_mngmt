import { fileTypeFromBuffer } from "file-type";
import { AppError } from "@/shared/utils/AppError.utils";
import { mimeMetadataMap } from "@/shared/constants/mimeExtensionMap";
import { logger } from "@/shared";

/**
 * Verifica si el MIME declarado coincide con el MIME real del archivo
 */
export const validateRealMime = async (
  buffer: Buffer,
  declaredMime: string,
  filename?: string
): Promise<{ mime: string; ext: string }> => {
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    logger.warn({
      message: "No se pudo detectar el MIME real",
      declaredMime,
      filename,
      context: "VALIDATE_REAL_MIME",
    });
    throw new AppError("No se pudo identificar el tipo real del archivo", 422);
  }

  const metadata = mimeMetadataMap[detected.mime];
  if (!metadata) {
    logger.warn({
      message: "MIME detectado no está permitido",
      detectedMime: detected.mime,
      filename,
      context: "VALIDATE_REAL_MIME",
    });
    throw new AppError("Tipo MIME no permitido", 415);
  }

  if (!metadata.safe) {
    logger.warn({
      message: "MIME detectado marcado como inseguro",
      detectedMime: detected.mime,
      label: metadata.label,
      filename,
      context: "VALIDATE_REAL_MIME",
    });
    throw new AppError("Tipo MIME inseguro", 415);
  }

  const isMatch = declaredMime === detected.mime;
  if (!isMatch) {
    logger.warn({
      message: "MIME declarado no coincide con MIME real",
      declaredMime,
      detectedMime: detected.mime,
      label: metadata.label,
      filename,
      context: "VALIDATE_REAL_MIME",
    });
    throw new AppError(
      `Tipo MIME inválido. Se esperaba ${declaredMime}, pero se detectó ${detected.mime}`,
      415
    );
  }

  return {
    mime: detected.mime,
    ext: metadata.ext,
  };
};