import { matchWarrantyDuration } from "../patterns";
import { normalizeTextLine } from "../patterns";

export function extractWarranty(
  text: string,
  issueDate: Date
): { duration?: number; validUntil?: Date; notes?: string } {
  const match = matchWarrantyDuration(text);
  if (!match) return {};

  const { quantity, unit, raw } = match;

  const duration =
    unit.startsWith("mes") ? quantity * 30 :
    unit.startsWith("año") ? quantity * 365 :
    quantity;

  const validUntil = new Date(issueDate.getTime() + duration * 86400000);
  const notes = normalizeTextLine(raw ?? text);

  return { duration, validUntil, notes };
}