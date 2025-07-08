import cloudinary from "../../config/cloudinary";

export const uploadToCloudinary = async (
    fileBuffer: Buffer,
    filename: string,
    mimetype: string
): Promise<{ url: string; type: string }> => {
    const base64 = `data:${mimetype};base64,${fileBuffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
        public_id: filename.replace(/\.[^/.]+$/, ""),
        resource_type: "auto",
        folder: "invoices"
    });

    return {
        url: result.secure_url,
        type: result.format.toUpperCase(),
    };
};