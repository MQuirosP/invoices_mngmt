import { ExtractedInvoiceMetadata } from "./core/ocr.types";

export function validateSemanticMetadata(meta: ExtractedInvoiceMetadata): boolean {
  if (!meta.title || meta.title.length < 3) return false;
  if (!meta.issueDate || isNaN(meta.issueDate.getTime())) return false;
  if (!meta.items || meta.items.length === 0) return false;
  if (meta.items.some(i => !i.description || i.quantity <= 0)) return false;
  return true;
}