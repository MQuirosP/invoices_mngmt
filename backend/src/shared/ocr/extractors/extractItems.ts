import { extractWarranty } from "./extractWarranty";
import {
  isDescriptiveLine,
  isItemLine,
  isWarrantyLine,
  matchStructuredItem,
  normalizeNumericLine,
  regexPatterns,
} from "@/shared/ocr/patterns/matchers";
import { InvoiceItemInput } from "../core/ocr.types";

export function extractItems(
  lines: string[],
  issueDate: Date
): InvoiceItemInput[] {
  const items: InvoiceItemInput[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Classic item line
    if (isItemLine(line)) {
      const match = line.match(regexPatterns.itemLine)!;
      const [_, priceStr, qtyStr, totalStr] = match;
      const description = line.replace(regexPatterns.itemLine, "").trim();

      const nextLines = lines.slice(i + 1, i + 4);
      const warrantyLine = nextLines.find(isWarrantyLine);
      const { duration, validUntil, notes } = warrantyLine
        ? extractWarranty(warrantyLine, issueDate)
        : {};

      items.push({
        description,
        quantity: parseInt(qtyStr, 10),
        unitPrice: parseFloat(priceStr.replace(",", "")),
        total: parseFloat(totalStr.replace(",", "")),
        warrantyDuration: duration ?? 0,
        warrantyValidUntil: validUntil ?? issueDate,
        warrantyNotes: notes ?? "No warranty",
      });

      continue;
    }

    // Structured item line
    const normalized = normalizeNumericLine(line);
    const structured = matchStructuredItem(normalized);
    if (structured) {
      const nextLines = lines.slice(i + 1, i + 3);
      const warrantyLine = nextLines.find(isWarrantyLine);
      const { duration, validUntil, notes } = warrantyLine
        ? extractWarranty(warrantyLine, issueDate)
        : {};

      items.push({
        description: structured.description,
        quantity: structured.quantity,
        unitPrice: structured.unitPrice,
        total: structured.total,
        warrantyDuration: warrantyLine ? duration ?? 180 : 0,
        warrantyValidUntil: warrantyLine
          ? validUntil ?? new Date(issueDate.getTime() + 180 * 864e5)
          : issueDate,
        warrantyNotes: notes ?? "No warranty",
      });

      continue;
    }

    // Descriptive fallback with warranty
    const nextLines = lines.slice(i + 1, i + 3);
    const warrantyLine = nextLines.find(isWarrantyLine);
    if (isDescriptiveLine(line) && warrantyLine) {
      const { duration, validUntil, notes } = extractWarranty(
        warrantyLine,
        issueDate
      );

      items.push({
        description: line.trim(),
        quantity: 1,
        unitPrice: 0,
        total: 0,
        warrantyDuration: duration ?? 180,
        warrantyValidUntil:
          validUntil ?? new Date(issueDate.getTime() + 180 * 864e5),
        warrantyNotes: notes ?? "No warranty",
      });
    }
  }

  return items;
}
