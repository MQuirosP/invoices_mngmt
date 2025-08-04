import { regexPatterns } from "./regex";

export function isItemLine(line: string): boolean {
  return regexPatterns.itemLine.test(line);
}

export function isWarrantyLine(line: string): boolean {
  return regexPatterns.warrantyKeywords.test(line);
}

export function isDescriptiveLine(line: string): boolean {
  return line.length > 15 && regexPatterns.descriptiveKeywords.test(line);
}

export function matchStructuredItem(line: string): {
  quantity: number;
  description: string;
  unitPrice: number;
  total: number;
} | null {
  const normalized = normalizeNumericLine(line);
  const match = normalized.match(regexPatterns.structuredItemLine);
  if (!match) return null;

  const [, qtyStr, desc, priceStr, totalStr] = match;

  return {
    quantity: parseFloat(qtyStr.replace(",", ".")),
    description: desc.trim(),
    unitPrice: fixMultiDotPrice(priceStr),
    total: parseFloat(totalStr.replace(",", ".")),
  };
}

export function normalizeNumericLine(line: string): string {
  return line
    .replace(/(\d)\s+\./g, "$1.") // removes spaces before decimal point
    .replace(/,\s+/g, ",") // removes spaces after comma
    .replace(/\.\s+/g, ".") // removes spaces after dot
    .replace(/\s{2,}/g, " ") // collapses multiple spaces
    .trim();
}

function fixMultiDotPrice(raw: string): number {
  const parts = raw.split(".");
  if (parts.length === 3) {
    // Example: ["2", "705", "55000"] → "2705.55"
    const intPart = parts[0] + parts[1];
    const decimalPart = parts[2].slice(0, 2); // 2 decimals only
    return parseFloat(`${intPart}.${decimalPart}`);
  }
  return parseFloat(raw.replace(",", "."));
}

export { regexPatterns };
