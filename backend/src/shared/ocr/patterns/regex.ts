export const regexPatterns = {
  titleKeywords:
    /\b(laptopcenter|factura|venta|electrónica|comercial|inversiones|argom|hp|pantalla|teclado)\b/i,
  invoiceNumberLine: /\bNo\.?\s*\d{6,}/i,
  
  itemLine: /([\d.,]+)\s+(\d+)\s+([\d.,]+)$/,
  warrantyKeywords: /(garant[ií]a|vigencia|válida|cubre)/i,
  warrantyDuration: /(?:garant[ií]a|vigencia|válida|cubre)\s*(?:por\s*)?(\d+)\s*(d[ií]as?|mes(?:es)?|a(?:ños?)?)/i,
  fallbackDuration: /(\d+)\s*(d[ií]as?|mes(?:es)?|a(?:ños?)?)/i,
  descriptiveKeywords: /\b(pantalla|bater[íi]a|estuche|tub|mini|argom|hp|orange|producto|servicio)\b/i,


  // New semantic patterns
  providerLine: /nombre\s+emisor[:\-]/i,
  providerExtract: /emisor[:\-]?\s*[-–—]?\s*(.+)/i,
  providerFallback: /(S\.A\.|Ltd|SRL|Comercial|Inversiones|OMEGA)/i,

  // Pattern for semantically structured lines
  structuredItemLine: /^(\d{1,3}[.,]?\d{0,2})\s+(.+?)\s+([\d.,]+)\s+([\d.,]+)$/

};
