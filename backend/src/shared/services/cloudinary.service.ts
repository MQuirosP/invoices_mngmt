import cloudinary from "@/config/cloudinary";
import { AppError } from "@/shared/utils/AppError.utils";
import { mimeExtensionMap } from "@/shared/constants/mimeExtensionMap";
import path from "path";

export class CloudinaryService {
  async upload(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
    userId: string
  ): Promise<{ url: string; type: string }> {
    try {
      const ext = mimeExtensionMap[mimetype];
      console.log("📎 MIME Type recibido:", mimetype);
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

      return {
        url: result.secure_url,
        type: mimetype,
      };
    } catch (error: any) {
      console.error("Error subiendo archivo", error.message);
      throw new AppError(error.message || "Cloudinary upload failed");
    }
  }

  async delete(
  userId: string,
  filename: string,
  mimetype: string
): Promise<void> {
  const nameWithoutExtension = path.basename(filename, path.extname(filename));
  const publicId = `${userId}/${nameWithoutExtension}`;

  let resource_type: "image" | "video" | "raw" = "raw";
  if (mimetype.startsWith("image/")) {
    resource_type = "image";
  } else if (mimetype.startsWith("video/")) {
    resource_type = "video";
  }

  console.log("🗑️ Deleting from Cloudinary:", publicId, resource_type);

  await cloudinary.uploader.destroy(publicId, {
    resource_type,
    invalidate: true,
  });
}
}
