import multer, { FileFilterCallback } from "multer";
import { mimeExtensionMap } from "../constants/mimeExtensionMap";

// Use of memory storage to directly upload to cloudinary
const storage = multer.memoryStorage();

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const declaredMime = file.mimetype;
  const originalName = file.originalname || '';

  const acceptedMimes = Object.keys(mimeExtensionMap);
  const acceptedExts = Object.values(mimeExtensionMap); // ej: ['pdf', 'jpg', 'png', 'xml']

  const isMimeValid = acceptedMimes.includes(declaredMime);
  const hasValidExtension = acceptedExts.some(ext =>
    originalName.toLowerCase().endsWith(`.${ext}`)
  );

  if (isMimeValid || hasValidExtension) {
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
