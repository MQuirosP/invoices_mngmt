import { ExtractedInvoiceMetadata } from "@/shared/ocr/ocr.types";
import {
  extractItems,
  extractProvider,
  extractIssueDate,
  extractWarranty,
  extractTitle,
} from '@/shared/ocr/extractors';
import { logger } from "@/shared/utils/logger";
import { calculateExpirationFromItems } from "./extractExpirationFromItems";

export function extractMetadataFromText(text: string): ExtractedInvoiceMetadata {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  const title = extractTitle(lines);
  const provider = extractProvider(lines);
  const issueDate = extractIssueDate(text);
  const items = extractItems(lines, issueDate);
  const { duration, validUntil } = extractWarranty(text, issueDate);

  const expiration = calculateExpirationFromItems(issueDate, items);

  logger.info({
    provider,
    title,
    issueDate,
    expiration,
    itemCount: items.length,
    step: "OCR_METADATA_EXTRACTED",
  });

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
