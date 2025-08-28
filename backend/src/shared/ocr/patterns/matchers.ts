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

export function normalizeTextLine(line: string): string {
  return line
    .replace(/\s+([(),])/g, "$1")     
    .replace(/\s*-\s*/g, "-")         
    .replace(/\s{2,}/g, " ")          
    .replace(/^\W+|\W+$/g, "")        
    .trim();
}

export function normalizeNumericLine(line: string): string {
  return line
    .replace(/(\d)\s+\./g, "$1.") 
    .replace(/,\s+/g, ",") 
    .replace(/\.\s+/g, ".") 
    .replace(/\s{2,}/g, " ") 
    .trim();
}

export function matchWarrantyDuration(text: string): { quantity: number; unit: string } | null {
  const cleaned = normalizeTextLine(text.toLowerCase());

  let match = cleaned.match(regexPatterns.warrantyDuration);
  if (!match && regexPatterns.warrantyKeywords.test(cleaned)) {
    match = cleaned.match(regexPatterns.fallbackDuration);
  }

  if (!match) return null;

  return {
    quantity: parseInt(match[1]),
    unit: match[2].toLowerCase(),
  };
}


function fixMultiDotPrice(raw: string): number {
  const parts = raw.split(".");
  if (parts.length === 3) {
    
    const intPart = parts[0] + parts[1];
    const decimalPart = parts[2].slice(0, 2); 
    return parseFloat(`${intPart}.${decimalPart}`);
  }
  return parseFloat(raw.replace(",", "."));
}

export { regexPatterns };
