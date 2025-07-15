import cloudinary from "@/config/cloudinary";
import { AppError } from "@/shared/utils/AppError.utils";
import { mimeExtensionMap } from "@/shared/constants/mimeExtensionMap";
import crypto from "crypto";
// import path from "path";

export class CloudinaryService {
  async upload(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
    userId: string
  ): Promise<{ url: string; type: string }> {
    try {
      const ext = mimeExtensionMap[mimetype];
      if (!ext) throw new AppError("Unsupported file type", 415);

      // Generar nombre random seguro
      const randomName = crypto.randomBytes(16).toString("hex");
      // Aquí creamos el public_id con nombre random + extensión
      const publicId = `${randomName}`;

      const base64 = `data:${mimetype};base64,${fileBuffer.toString("base64")}`;

      const result = await cloudinary.uploader.upload(base64, {
        public_id: publicId,
        resource_type: "auto",
        folder: `${userId}`, // opcional porque ya está en public_id
        type: "upload",
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
}
