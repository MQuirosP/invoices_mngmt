export function extractTitle(lines: string[]): string {
  return lines[0] || "Factura sin título";
}