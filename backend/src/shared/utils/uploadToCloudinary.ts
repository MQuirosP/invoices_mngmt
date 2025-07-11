import cloudinary from "@/config/cloudinary";
import { AppError } from "./AppError.utils";
import path from "path";

const mimeExtensionMap: Record<string, string> = {
  "application/pdf": "pdf",
  "application/xml": "xml",
  "text/xml": "xml",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
};

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  filename: string,
  mimetype: string
): Promise<{ url: string; type: string }> => {
  try {
    const ext = mimeExtensionMap[mimetype];
    if (!ext) throw new AppError("Unsupported file type", 415);

    const base64 = `data:${mimetype};base64,${fileBuffer.toString("base64")}`;
    const baseName = path.basename(filename, path.extname(filename));

    const result = await cloudinary.uploader.upload(base64, {
      public_id: baseName,
      resource_type: "auto",
      folder: "invoices",
      type: "upload",
      overwrite: true,
    });

    return {
      url: result.secure_url,
      type: result.format.toUpperCase(),
    };
  } catch (error: any) {
    console.error("Error subiendo archivo", error.message);
    throw new AppError(error.message || "Cloudinary upload failed");
  }
};
