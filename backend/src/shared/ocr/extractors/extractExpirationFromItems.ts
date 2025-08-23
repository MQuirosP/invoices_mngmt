import { InvoiceItemInput } from "../core/ocr.types";

export function calculateExpirationFromItems(issueDate: Date, items: InvoiceItemInput[]): Date {
  const max = items.reduce((acc, item) => Math.max(acc, item.warrantyDuration ?? 0), 0);
  return new Date(issueDate.getTime() + (max || 180) * 864e5);
}