import { matchWarrantyDuration } from "../patterns";

export function extractWarranty(
  text: string,
  issueDate: Date
): { duration?: number; validUntil?: Date } {
  const match = matchWarrantyDuration(text);
  if (!match) return {};

  const { quantity, unit } = match;

  const duration =
    unit.startsWith("mes") ? quantity * 30 :
    unit.startsWith("año") ? quantity * 365 :
    quantity;

  const validUntil = new Date(issueDate.getTime() + duration * 86400000);
  return { duration, validUntil };
}