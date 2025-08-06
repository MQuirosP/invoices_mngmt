import cloudinary from "@/config/cloudinary";
import { AppError } from "@/shared/utils/AppError.utils";
import { mimeExtensionMap } from "@/shared/constants/mimeExtensionMap";
import path from "path";
import { logger } from "@/shared/utils/logger";

export class CloudinaryService {
  async upload(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
    userId: string
  ): Promise<{ url: string; type: string }> {
    try {
      const ext = mimeExtensionMap[mimetype];
      // console.log("Received MIME type:", mimetype);
      logger.info({
        action: "CLOUDINARY_UPLOAD_INIT",
        context: "CLOUDINARY_SERVICE",
        mimetype,
        filename,
        userId,
      });
      if (!ext) throw new AppError("Unsupported file type", 415);

      const base64 = `data:${mimetype};base64,${fileBuffer.toString("base64")}`;
      const baseName = path.basename(filename, path.extname(filename));

      const result = await cloudinary.uploader.upload(base64, {
        public_id: baseName,
        resource_type: "auto",
        folder: `${userId}`,
        type: "upload",
        overwrite: true,
      });

      if (!result.secure_url) {
        throw new AppError("Cloudinary upload failed");
      }

      logger.info({
        action: "CLOUDINARY_UPLOAD_SUCCESS",
        context: "CLOUDINARY_SERVICE",
        url: result.secure_url,
        userId,
        filename,
        mimetype,
      });
      return {
        url: result.secure_url,
        type: mimetype,
      };
    } catch (error: any) {
      // console.error("Error uploading file:", error.message);
      logger.error({
        action: "CLOUDINARY_UPLOAD_ERROR",
        context: "CLOUDINARY_SERVICE",
        error,
        userId,
        filename,
        mimetype,
      });

      throw new AppError(error.message || "Cloudinary upload failed");
    }
  }

  async delete(
    userId: string,
    filename: string,
    mimetype: string
  ): Promise<void> {
    try {
      const nameWithoutExtension = path.basename(
        filename,
        path.extname(filename)
      );
      const publicId = `${userId}/${nameWithoutExtension}`;

      let resource_type: "image" | "video" | "raw" = "raw";
      if (mimetype.startsWith("image/")) {
        resource_type = "image";
      } else if (mimetype.startsWith("video/")) {
        resource_type = "video";
      }

      logger.info({
        action: "CLOUDINARY_DELETE_INIT",
        context: "CLOUDINARY_SERVICE",
        publicId,
        resource_type,
      });

      await cloudinary.uploader.destroy(publicId, {
        resource_type,
        invalidate: true,
      });

      logger.info({
        action: "CLOUDINARY_DELETE_SUCCESS",
        context: "CLOUDINARY_SERVICE",
        publicId,
        resource_type,
      });
    } catch (error: any) {
      logger.error({
        action: "CLOUDINARY_DELETE_ERROR",
        context: "CLOUDINARY_SERVICE",
        error,
        userId,
        filename,
        mimetype,
      });

      throw new AppError("Cloudinary deletion failed", 500);
    }
  }
}
