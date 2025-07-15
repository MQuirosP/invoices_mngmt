import multer, { FileFilterCallback } from "multer";
import { mimeExtensionMap } from "../constants/mimeExtensionMap";

// Use of memory storage to directly upload to cloudinary
const storage = multer.memoryStorage();

const allowedMimeTypes = Object.keys(mimeExtensionMap);

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Only PDF, XML, JPG, PNG allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});
