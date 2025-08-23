import cloudinary from "@/config/cloudinary";
import { AppError } from "@/shared/utils/appError.utils";
import { mimeExtensionMap } from "@/shared/constants/mimeExtensionMap";
import path from "path";
import { logger } from "@/shared/utils/logging/logger";
import { uploadWithRetry } from "../utils/retries/uploadWithRetry";

export class CloudinaryService {
  async upload(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
    userId: string
  ): Promise<{ url: string; type: string }> {
    const timestamp = new Date().toISOString();
    const ext = mimeExtensionMap[mimetype];

    logger.info({
      layer: "service",
      module: "cloudinary",
      action: "CLOUDINARY_UPLOAD_INIT",
      mimetype,
      filename,
      userId,
      timestamp,
    });

    if (!ext) {
      throw new AppError("Unsupported file type", 415, true, undefined, {
        layer: "service",
        module: "cloudinary",
        reason: "UNSUPPORTED_MIME_TYPE",
        mimetype,
        filename,
        userId,
        timestamp,
      });
    }

    const baseName = path.basename(filename, path.extname(filename));

    try {
      const result = await uploadWithRetry(fileBuffer, {
        public_id: baseName,
        folder: userId,
        resource_type: "auto",
        type: "upload",
        overwrite: true,
      });

      if (!result.secure_url) {
        throw new AppError("Cloudinary upload failed", 500, true, undefined, {
          layer: "service",
          module: "cloudinary",
          reason: "NO_URL_RETURNED",
          filename,
          userId,
          mimetype,
          timestamp,
        });
      }

      logger.info({
        layer: "service",
        module: "cloudinary",
        action: "CLOUDINARY_UPLOAD_SUCCESS",
        url: result.secure_url,
        userId,
        filename,
        mimetype,
        timestamp,
      });

      return {
        url: result.secure_url,
        type: mimetype,
      };
    } catch (error: any) {
      logger.error({
        layer: "service",
        module: "cloudinary",
        action: "CLOUDINARY_UPLOAD_ERROR",
        error: error instanceof Error ? error.message : String(error),
        userId,
        filename,
        mimetype,
        timestamp,
      });

      throw new AppError("Cloudinary upload failed", 500, true, error, {
        layer: "service",
        module: "cloudinary",
        reason: "UPLOAD_EXCEPTION",
        userId,
        filename,
        mimetype,
        timestamp,
      });
    }
  }

  async delete(
    userId: string,
    filename: string,
    mimetype: string
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const nameWithoutExtension = path.basename(filename, path.extname(filename));
    const publicId = `${userId}/${nameWithoutExtension}`;

    let resource_type: "image" | "video" | "raw" = "raw";
    if (mimetype.startsWith("image/")) {
      resource_type = "image";
    } else if (mimetype.startsWith("video/")) {
      resource_type = "video";
    }

    logger.info({
      layer: "service",
      module: "cloudinary",
      action: "CLOUDINARY_DELETE_INIT",
      publicId,
      resource_type,
      timestamp,
    });

    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type,
        invalidate: true,
      });

      logger.info({
        layer: "service",
        module: "cloudinary",
        action: "CLOUDINARY_DELETE_SUCCESS",
        publicId,
        resource_type,
        timestamp,
      });
    } catch (error: any) {
      logger.error({
        layer: "service",
        module: "cloudinary",
        action: "CLOUDINARY_DELETE_ERROR",
        error: error instanceof Error ? error.message : String(error),
        userId,
        filename,
        mimetype,
        timestamp,
      });

      throw new AppError("Cloudinary deletion failed", 500, true, error, {
        layer: "service",
        module: "cloudinary",
        reason: "DELETE_EXCEPTION",
        userId,
        filename,
        mimetype,
        timestamp,
      });
    }
  }
}