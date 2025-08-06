import crypto from "crypto";
import { mimeExtensionMap } from "@/shared/constants/mimeExtensionMap";

export function generateRandomFilename(mimetype: string, invoiceId?: string): string {
  const extension = mimeExtensionMap[mimetype];
  if (!extension) throw new Error(`Unsupported MIME type: ${mimetype}`);

  const randomName = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();

  return invoiceId
    ? `${invoiceId}-${timestamp}-${randomName}`
    : `${timestamp}-${randomName}`;
}