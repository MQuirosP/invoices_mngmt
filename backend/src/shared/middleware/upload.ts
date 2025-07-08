import multer from "multer";

// Use of memory storage to directly upload to cloudinary
const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max
    },
});