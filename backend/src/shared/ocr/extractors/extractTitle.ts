import { regexPatterns } from "@/shared/ocr/patterns/matchers";

export function extractTitle(lines: string[]): string {
  for (const line of lines) {
    const isTitleCandidate = regexPatterns.titleKeywords.test(line);
    const isInvoiceNumber = regexPatterns.invoiceNumberLine.test(line);

    if (isTitleCandidate && !isInvoiceNumber) {
      return line.trim();
    }
  }

  // Fallback: línea con nombre comercial
  const fallback = lines.find((line) =>
    regexPatterns.providerFallback.test(line)
  );

  return fallback?.trim() || "Factura sin título";
}