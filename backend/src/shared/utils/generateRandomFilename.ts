import crypto from "crypto";
import { mimeExtensionMap } from "@/shared/constants/mimeExtensionMap";

export function generateRandomFilename(mimetype: string): string {
  console.log(mimetype)
  const extension = mimeExtensionMap[mimetype];
  if (!extension) throw new Error(`Unsupported MIME type: ${mimetype}`);

  const randomName = crypto.randomBytes(16).toString("hex");
  return `${randomName}`;
}
