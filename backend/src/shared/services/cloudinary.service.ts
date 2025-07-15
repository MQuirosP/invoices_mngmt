import cloudinary from "@/config/cloudinary";
import { AppError } from "@/shared/utils/AppError.utils";
import { mimeExtensionMap } from "@/shared/constants/mimeExtensionMap";
import { logError } from "../utils/logger";

export class CloudinaryService {
  async upload(
  fileBuffer: Buffer,
  filename: string,
  mimetype: string,
  userId: string
): Promise<{ url: string; type: string }> {
  try {
    if (!mimeExtensionMap[mimetype]) {
      throw new AppError("Unsupported file type", 415);
    }

    const base64 = `data:${mimetype};base64,${fileBuffer.toString("base64")}`;
    const publicId = `${userId}/${filename}`; // nombre completo ya viene generado antes

    const result = await cloudinary.uploader.upload(base64, {
      public_id: publicId,
      resource_type: "auto", // sigue siendo válido para upload
      overwrite: false,
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


  async delete(publicId: string, mimetype: string): Promise<void> {
    console.log(publicId, mimetype);
    try {
      let resource_type: "image" | "video" | "raw" = "raw";
      if (mimetype.startsWith("image/")) {
        resource_type = "image";
      } else if (mimetype.startsWith("video/")) {
        resource_type = "video";
      }
      await cloudinary.uploader.destroy(publicId, { resource_type });
    } catch (error: any) {
      logError(error.message, "Error eliminando archivo");
      throw new AppError(error.message || "Cloudinary delete failed");
    }
  }
}
