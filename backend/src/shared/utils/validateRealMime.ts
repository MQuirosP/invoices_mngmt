import { fileTypeFromBuffer } from "file-type";
import { AppError } from "@/shared/utils/AppError.utils";
import { mimeExtensionMap } from "@/shared/constants/mimeExtensionMap";

/**
 * Verifica si el MIME declarado coincide con el MIME real del archivo
 */
export const validateRealMime = async (
  buffer: Buffer,
  declaredMime: string
): Promise<{ mime: string; ext: string }> => {
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    throw new AppError("No se pudo identificar el tipo real del archivo", 422);
  }

  const isMatch = declaredMime === detected.mime;
  if (!isMatch) {
    throw new AppError(
      `Tipo MIME inválido. Se esperaba ${declaredMime}, pero se detectó ${detected.mime}`,
      415
    );
  }

  const ext = mimeExtensionMap[detected.mime];
  if (!ext) {
    throw new AppError("Extensión no permitida", 415);
  }

  return {
    mime: detected.mime,
    ext,
  };
};
