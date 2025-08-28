import { AppError } from "@/shared/utils/appError.utils";
import { validateRealMime } from "../../validators/validateRealMime";
import { logger } from "@/shared/utils/logging/logger";
import { FileFetcherService } from "@/shared/services/fileFetcher.service";
import { MimeConfig } from "../../constants/mimeExtensionMap";

export const prepareBufferForExtraction = async (
  url: string
): Promise<{
  buffer: Buffer;
  filename: string;
  declaredMime: string;
  validatedMime: string;
}> => {
  const fetcher = new FileFetcherService();
  const buffer = await fetcher.fetchBuffer(url);

  const filename = url.split("/").pop()?.split("?")[0] || "unknown";
  const ext = filename.split(".").pop()?.toLowerCase();

  if (
    !ext ||
    !Object.values(MimeConfig.metadata).some((meta) => meta.ext === ext)
  ) {
    throw new AppError(
      "Unsupported or missing file extension",
      415,
      true,
      undefined,
      {
        layer: "file",
        module: "file.core",
        reason: "EXTENSION_NOT_ALLOWED",
        filename,
        url,
      }
    );
  }

  const declaredMime = MimeConfig.getMimeFromExt(ext);
  if (!declaredMime) {
    throw new AppError(
      "Unsupported or missing declared MIME type",
      415,
      true,
      undefined,
      {
        layer: "file",
        module: "file.core",
        reason: "MIME_TYPE_NOT_ALLOWED",
        filename,
        url,
      }
    );
  }
  const { mime: validatedMime } = await validateRealMime(
    buffer,
    declaredMime,
    filename
  );

  logger.info({
    layer: "service",
    action: "FILE_PREPARE_FOR_EXTRACTION_SUCCESS",
    filename,
    declaredMime,
    validatedMime,
    url,
  });

  return { buffer, filename, declaredMime, validatedMime };
};
