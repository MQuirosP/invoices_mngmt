import crypto from "crypto";
import { MimeConfig } from "../../constants/mimeExtensionMap";

export function generateRandomFilename(mimetype: string, invoiceId?: string): string {
  const extension = MimeConfig.getExtension(mimetype);
  if (!extension) throw new Error(`Unsupported MIME type: ${mimetype}`);

  const randomName = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();

  return invoiceId
    ? `${invoiceId}-${timestamp}-${randomName}`
    : `${timestamp}-${randomName}`;
}