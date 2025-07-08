import cloudinary from "../../config/cloudinary";
import { AppError } from './AppError';

export const uploadToCloudinary = async (
    fileBuffer: Buffer,
    filename: string,
    mimetype: string
): Promise<{ url: string; type: string }> => {
    try {
        
        const base64 = `data:${mimetype};base64,${fileBuffer.toString("base64")}`;
    
        const result = await cloudinary.uploader.upload(base64, {
            public_id: filename.replace(/\.[^/.]+$/, ""),
            resource_type: "auto",
            folder: "invoices",
            type: "upload"
        });
    
        return {
            url: result.secure_url,
            type: result.format.toUpperCase(),
        };
    } catch (error: any) {
        console.error("Error subiendo archivo", error.message);
        throw new AppError(error.message || "Cloudinary upload failed")
    }
};