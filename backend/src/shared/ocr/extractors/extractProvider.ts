import { regexPatterns } from "@/shared/ocr/patterns";

export function extractProvider(lines: string[]): string {
  const emisorLine = lines.find((line) =>
    regexPatterns.providerLine.test(line)
  );

  if (emisorLine) {
    const match = emisorLine.match(regexPatterns.providerExtract);
    if (match?.[1]) {
      return match[1].trim().replace(/[-–—]+$/, "").trim();
    }
  }

  const fallback = lines.find((line) =>
    regexPatterns.providerFallback.test(line)
  );

  return fallback?.trim() ?? "Unidentified provider";
}