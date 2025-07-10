// src/modules/imports/utils/extractMetadata.util.ts

export interface ExtractedInvoiceMetadata {
  expiration: Date;
  title: string;
  provider: string;
  issueDate: Date;
  duration?: number; // days
  validUntil?: Date;
}

export function extractMetadataFromText(text: string): ExtractedInvoiceMetadata {
  const cleanText = text.toLowerCase();

  // 🔍 Firs important line
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const title = lines[0] || 'Factura sin título';

  // 🔍 Line with key words
const providerMatch = lines.slice(1).find(line =>
  line.match(/(S\.A\.|Ltd|SRL|Comercial|Inversiones|Cédula Jurídica)/i)
) || lines[1]; // fallback a segunda línea

const provider = providerMatch || 'Proveedor no identificado';


  // 🔍 Date
  const dateRegex = /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/;
  const dateMatch = cleanText.match(dateRegex);
  const issueDate = dateMatch ? parseDate(dateMatch[1]) : new Date();

  // 🔍 Get warranty
  const durationRegex = /garant[ií]a\s+de\s+(\d+)\s*(d[ií]as|meses|años?)/i;
  const durationMatch = cleanText.match(durationRegex);
  let duration: number | undefined;
  if (durationMatch) {
    const cantidad = parseInt(durationMatch[1]);
    const unidad = durationMatch[2];
    if (unidad.startsWith('mes')) duration = cantidad * 30;
    else if (unidad.startsWith('año')) duration = cantidad * 365;
    else duration = cantidad;
  }

  const validUntil = duration
    ? new Date(issueDate.getTime() + duration * 24 * 60 * 60 * 1000)
    : undefined;

// Set expiration as validUntil or issueDate as fallback
const expiration = validUntil ?? issueDate;

return {
  title,
  provider,
  issueDate,
  duration,
  validUntil,
  expiration
};
}

function parseDate(raw: string): Date {
  const [d, m, y] = raw.split(/[\/\-\.]/);
  return new Date(`${y}-${m}-${d}`);
}
