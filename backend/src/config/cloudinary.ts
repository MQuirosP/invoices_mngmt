import dotenv from 'dotenv';
import { v2 as cloudinary } from "cloudinary";
import { logger } from '@/shared/utils/logger';

dotenv.config();


if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  logger.error({
    action: "CLOUDINARY_CONFIG_MISSING",
    message: "Missing Cloudinary configuration in env variables",
    context: "CLOUDINARY_INIT",
    missing: {
      CLOUDINARY_CLOUD_NAME: !process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: !process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: !process.env.CLOUDINARY_API_SECRET,
    },
  });

  throw new Error("Missing Cloudinary configuration in env variables");
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export default cloudinary;