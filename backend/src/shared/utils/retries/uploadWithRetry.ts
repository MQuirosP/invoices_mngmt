import { logger } from "@/shared/utils/logging/logger";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

interface UploadOptions {
  public_id: string;
  folder?: string;
  resource_type?: "image" | "video" | "raw" | "auto";
  type?: "upload";
  overwrite?: boolean;
}

function uploadStream(file: Buffer, options: UploadOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { ...options },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    streamifier.createReadStream(file).pipe(uploadStream);
  });
}

export async function uploadWithRetry(
  file: Buffer,
  options: UploadOptions,
  attempt = 1
): Promise<any> {
  const maxAttempts = 3;
  const timestamp = new Date().toISOString();

  try {
    const result = await uploadStream(file, options);

    logger.info({
      layer: "shared",
      module: "upload-retry",
      action: "CLOUDINARY_UPLOAD_SUCCESS",
      public_id: options.public_id,
      folder: options.folder,
      attempt,
      timestamp,
    });

    return result;
  } catch (err) {
    logger.warn({
      layer: "shared",
      module: "upload-retry",
      action: "CLOUDINARY_UPLOAD_RETRY",
      public_id: options.public_id,
      folder: options.folder,
      attempt,
      error: err instanceof Error ? err.message : String(err),
      timestamp,
    });

    if (attempt >= maxAttempts) {
      logger.error({
        layer: "shared",
        module: "upload-retry",
        action: "CLOUDINARY_UPLOAD_FAILED",
        public_id: options.public_id,
        folder: options.folder,
        error: err instanceof Error ? err.message : String(err),
        reason: "MAX_RETRIES_EXCEEDED",
        timestamp,
      });

      throw err;
    }

    await new Promise((r) => setTimeout(r, 500 * attempt)); // backoff lineal
    return uploadWithRetry(file, options, attempt + 1);
  }
}