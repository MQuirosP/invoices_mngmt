export interface ExtractedInvoiceMetadata {
  expiration: Date;
  title: string;
  provider: string;
  issueDate: Date;
  duration?: number; // days
  validUntil?: Date;
  mimeType?: string;
  items?: InvoiceItemInput[];
}

export interface ExtractedMetadata {
  title: string;
  issueDate: Date;
  expiration?: Date;
  provider?: string;
  duration?: number;
  validUntil?: Date;
  mimeType?: string;
}

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export function extractMetadataFromText(
  text: string
): ExtractedInvoiceMetadata {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const title = extractTitle(lines);
  const provider = extractProvider(lines);
  const issueDate = extractIssueDate(text);
  const { duration, validUntil } = extractWarranty(text, issueDate);
  const items = extractItems(text);

  const expiration = validUntil ?? issueDate;

  return {
    title,
    provider,
    issueDate,
    duration,
    validUntil,
    expiration,
    items,
  };
}

function extractTitle(lines: string[]): string {
  return lines[0] || "Factura sin título";
}

function extractProvider(lines: string[]): string {
  return (
    lines
      .slice(1)
      .find((line) =>
        /(S\.A\.|Ltd|SRL|Comercial|Inversiones|Cédula Jurídica)/i.test(line)
      ) ||
    lines[1] ||
    "Proveedor no identificado"
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

  const quantity = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  let duration: number;
  if (unit.startsWith("mes")) duration = quantity * 30;
  else if (unit.startsWith("año")) duration = quantity * 365;
  else duration = quantity;

  const validUntil = new Date(issueDate.getTime() + duration * 86400000);
  return { duration, validUntil };
}

export function extractItems(text: string): InvoiceItemInput[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // console.log("📄 OCR Lines:");
  // lines.forEach((line, index) => {
  //   console.log(`${index.toString().padStart(3, " ")}: ${line}`);
  // });

  const items: InvoiceItemInput[] = [];

  // Regex para detectar líneas que terminan con: precio cantidad total
  const itemLineRegex = /([\d.,]+)\s+(\d+)\s+([\d.,]+)$/;

  for (const line of lines) {
    const match = line.match(itemLineRegex);
    if (match) {
      const [_, priceStr, qtyStr, totalStr] = match;

      const description = line.replace(itemLineRegex, "").trim();

      const item: InvoiceItemInput = {
        description,
        unitPrice: parseFloat(priceStr.replace(",", "")),
        quantity: parseInt(qtyStr),
        total: parseFloat(totalStr.replace(",", "")),
      };

      items.push(item);
    }
  }

  return items;
}

function parseDate(raw: string): Date {
  const [d, m, y] = raw.split(/[\/\-\.]/);
  const parsed = new Date(`${y}-${m}-${d}`);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}
