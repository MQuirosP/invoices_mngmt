// 🔁 middleware
export * from './middleware/core/errorHandler';
export * from './middleware/core/validateParams';
export * from './middleware/core/setupGlobalMiddleware';

// ⚙️ utils
export * from './utils/appError.utils';
export * from './utils/file/getFileExtension';
export * from './utils/file/generateRandomFilename';
export * from './utils/logging/logger';
export * from './utils/security/requireUserId';
export * from './utils/file/validateRealMime';

// 📦 services
export * from './services/attachment.service';
export * from './services/cloudinary.service';
export * from './services/fileFetcher.service';
export * from './services/import.service';

// 🧠 OCR
export * from './ocr/core/ocr.pipeline';
export * from './ocr/core/ocr.types';
export * from './ocr/core/ocr.factory';
export * from './ocr/core/preprocessing';
export * from './ocr/providers/gcp';
export * from './ocr/providers/tesseract';

// 🔒 constantes
export * from './constants/mimeExtensionMap';
export * from './constants/roles';

// 🛡️ features
export * from './middleware/features/rateLimiter';
export * from './middleware/features/requireRole';
export * from './middleware/features/upload';