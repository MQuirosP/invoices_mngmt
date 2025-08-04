import { ExtractedInvoiceMetadata } from "../ocr.types";
import {
  extractItems,
  extractProvider,
  extractIssueDate,
  extractWarranty,
  extractTitle,
} from "./index";



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









