import axios from "axios";
import sharp from "sharp";
import { ExtractedInvoiceMetadata } from "./ocr.types";
import { extractItems } from "./extractors/extractItems";
import { extractProvider } from "./extractors/extractProvider";
import { extractIssueDate } from "./extractors/extractIssueDate";
import { extractWarranty } from "./extractors/extractWarranty";

export const fetchBuffer = async (url: string): Promise<Buffer> => {
  const res = await axios.get<ArrayBuffer>(url, {
    responseType: "arraybuffer",
  });
  return Buffer.from(res.data);
};

export const preprocessImage = async (buffer: Buffer): Promise<Buffer> => {
  return sharp(buffer)
    .resize({ width: 1500 })
    .grayscale()
    .linear(1.2, -10)
    .threshold(150)
    .toBuffer();
};

export const logOCR = (msg: string, data?: any) => {
  console.log(`🧠 OCR: ${msg}`, data || "");
};

export function extractMetadataFromText(
  text: string
): ExtractedInvoiceMetadata {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  console.log(lines);
  const title = extractTitle(lines);
  const provider = extractProvider(lines);
  const issueDate = extractIssueDate(text);
  const { duration, validUntil } = extractWarranty(text, issueDate);
  const items = extractItems(lines, issueDate);
  const expiration = validUntil ?? issueDate;

  return {
    title,
    provider,
    issueDate,
    expiration,
    duration,
    validUntil,
    items,
  };
}

function extractTitle(lines: string[]): string {
  return lines[0] || "Factura sin título";
}







