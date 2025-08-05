import { ExtractedInvoiceMetadata } from "@/shared/ocr/ocr.types";
import {
  extractItems,
  extractProvider,
  extractIssueDate,
  extractWarranty,
  extractTitle,
} from '@/shared/ocr/extractors';
import { logger } from "@/shared/utils/logger";



export function extractMetadataFromText(
  text: string
): ExtractedInvoiceMetadata {
  const lines = text
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);
  const title = extractTitle(lines);
  const provider = extractProvider(lines);
  const issueDate = extractIssueDate(text);
  const { duration, validUntil } = extractWarranty(text, issueDate);
  const items = extractItems(lines, issueDate);
  const expiration = validUntil ?? issueDate;
  logger.info({ provider, step: "OCR_STARTED", lines: lines.length });

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









