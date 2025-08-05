export const regexPatterns = {
  itemLine: /([\d.,]+)\s+(\d+)\s+([\d.,]+)$/, // clásico
  warrantyKeywords: /(garant[ií]a|vigencia|válida|cubre)/i,
  descriptiveKeywords: /\b(pantalla|batería|estuche|tub|mini|argom|hp|orange|producto|servicio)\b/i,

   // New semantic patterns
  providerLine: /nombre\s+emisor[:\-]/i,
  providerExtract: /emisor[:\-]?\s*[-–—]?\s*(.+)/i,
  providerFallback: /(S\.A\.|Ltd|SRL|Comercial|Inversiones|OMEGA)/i,


  // Pattern for semantically structured lines
  structuredItemLine: /^(\d{1,3}[.,]?\d{0,2})\s+[A-Z0-9\-]+\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)$/,
};