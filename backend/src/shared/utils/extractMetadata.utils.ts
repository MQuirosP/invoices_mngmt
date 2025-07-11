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
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

  const title = extractTitle(lines);
  const provider = extractProvider(lines);
  const issueDate = extractIssueDate(text);
  const { duration, validUntil } = extractWarranty(text, issueDate);

  const expiration = validUntil ?? issueDate;

  return {
    title,
    provider,
    issueDate,
    duration,
    validUntil,
    expiration,
  };
}

function extractTitle(lines: string[]): string {
  return lines[0] || 'Factura sin título';
}

function extractProvider(lines: string[]): string {
  return (
    lines.slice(1).find((line) =>
      /(S\.A\.|Ltd|SRL|Comercial|Inversiones|Cédula Jurídica)/i.test(line)
    ) || lines[1] || 'Proveedor no identificado'
  );
}

function extractIssueDate(text: string): Date {
  const dateRegex = /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/;
  const match = text.toLowerCase().match(dateRegex);
  return match ? parseDate(match[1]) : new Date();
}

function extractWarranty(
  text: string,
  issueDate: Date
): { duration?: number; validUntil?: Date } {
  const durationRegex = /garant[ií]a\s+de\s+(\d+)\s*(d[ií]as|meses|años?)/i;
  const match = text.toLowerCase().match(durationRegex);

  if (!match) return {};

  const cantidad = parseInt(match[1]);
  const unidad = match[2].toLowerCase();

  let duration: number;
  if (unidad.startsWith('mes')) duration = cantidad * 30;
  else if (unidad.startsWith('año')) duration = cantidad * 365;
  else duration = cantidad;

  const validUntil = new Date(issueDate.getTime() + duration * 86400000);
  return { duration, validUntil };
}

function parseDate(raw: string): Date {
  const [d, m, y] = raw.split(/[\/\-\.]/);
  const parsed = new Date(`${y}-${m}-${d}`);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}
