import { logger } from "@/shared/utils/logger";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

interface UploadOptions {
  public_id: string;
  folder?: string;
  resource_type?: "image" | "video" | "raw" | "auto";
}

function uploadStream(file: Buffer, options: UploadOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
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

  try {
    const result = await uploadStream(file, options);

    logger.info({
      action: "CLOUDINARY_UPLOAD_SUCCESS",
      public_id: options.public_id,
      attempt,
      context: "FILE_UPLOAD",
    });

    return result;
  } catch (err) {
    logger.warn({
      action: "CLOUDINARY_UPLOAD_RETRY",
      public_id: options.public_id,
      attempt,
      context: "FILE_UPLOAD",
      error: err instanceof Error ? err.message : String(err),
    });

    if (attempt >= maxAttempts) {
      logger.error({
        action: "CLOUDINARY_UPLOAD_FAILED",
        public_id: options.public_id,
        context: "FILE_UPLOAD",
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }

    await new Promise((r) => setTimeout(r, 500 * attempt)); // backoff lineal
    return uploadWithRetry(file, options, attempt + 1);
  }
}