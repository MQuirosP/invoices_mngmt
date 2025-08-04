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
    .replace(/(\d)\s+\./g, "$1.") // elimina espacios antes de punto decimal
    .replace(/,\s+/g, ",")        // elimina espacios después de coma
    .replace(/\.\s+/g, ".")       // elimina espacios después de punto
    .replace(/\s{2,}/g, " ")      // colapsa espacios múltiples
    .trim();
}

function fixMultiDotPrice(raw: string): number {
  const parts = raw.split(".");
  if (parts.length === 3) {
    // Ejemplo: ["2", "705", "55000"] → "2705.55"
    const intPart = parts[0] + parts[1];
    const decimalPart = parts[2].slice(0, 2); // solo dos decimales
    return parseFloat(`${intPart}.${decimalPart}`);
  }
  return parseFloat(raw.replace(",", "."));
}