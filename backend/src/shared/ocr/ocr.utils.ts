import axios from "axios";
import sharp from "sharp";
import { ExtractedInvoiceMetadata, InvoiceItemInput } from "./ocr.types";

export const fetchBuffer = async (url: string): Promise<Buffer> => {
  const res = await axios.get<ArrayBuffer>(url, {
    responseType: "arraybuffer",
  });
  return Buffer.from(res.data);
};

export const preprocessImage = async (buffer: Buffer): Promise<Buffer> => {
  return sharp(buffer)
    .resize({ width: 1500 })
    .grayscale()
    .linear(1.2, -10)
    .threshold(150)
    .toBuffer();
};

export const logOCR = (msg: string, data?: any) => {
  console.log(`🧠 OCR: ${msg}`, data || "");
};

export function extractMetadataFromText(
  text: string
): ExtractedInvoiceMetadata {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  console.log(lines)
  const title = extractTitle(lines);
  const provider = extractProvider(lines);
  const issueDate = extractIssueDate(text);
  const { duration, validUntil } = extractWarranty(text, issueDate);
  const items = extractItems(lines, issueDate);
  const expiration = validUntil ?? issueDate;

  return {
    title,
    provider,
    issueDate,
    expiration,
    duration,
    validUntil,
    items,
  };
}

function extractTitle(lines: string[]): string {
  return lines[0] || "Factura sin título";
}

function extractIssueDate(text: string): Date {
  const dateRegex = /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/;
  const match = text.toLowerCase().match(dateRegex);
  return match ? parseDate(match[1]) : new Date();
}

function parseDate(raw: string): Date {
  const [d, m, y] = raw.split(/[\/\-\.]/);
  const parsed = new Date(`${y}-${m}-${d}`);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function extractProvider(lines: string[]): string {
  return (
    lines.find((line) =>
      /(S\.A\.|Ltd|SRL|Comercial|Inversiones|Cédula Jurídica)/i.test(line)
    ) ||
    lines[1] ||
    "Proveedor no identificado"
  );
}

function extractItems(lines: string[], issueDate: Date): InvoiceItemInput[] {
  const regex = /([\d.,]+)\s+(\d+)\s+([\d.,]+)$/;
  const items: InvoiceItemInput[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(regex);
    if (!match) continue;

    const [_, priceStr, qtyStr, totalStr] = match;
    const description = line.replace(regex, "").trim();

    // Buscar hasta 3 líneas siguientes que contengan info de garantía
    const nextLines = lines.slice(i + 1, i + 4);
    const warrantyLine = nextLines.find((l) =>
      /garant[ií]a|vigencia|válida|cubre/i.test(l)
    );

    const { duration, validUntil } = warrantyLine
      ? extractWarranty(warrantyLine, issueDate)
      : {};

    if (warrantyLine && !duration) {
      logOCR("⚠️ No se pudo extraer duración de garantía:", warrantyLine);
    }

    items.push({
      description,
      quantity: parseInt(qtyStr),
      unitPrice: parseFloat(priceStr.replace(",", "")),
      total: parseFloat(totalStr.replace(",", "")),
      warrantyDuration: duration ?? (warrantyLine ? 365 : null),
      warrantyValidUntil: validUntil ?? (warrantyLine
        ? new Date(issueDate.getTime() + 365 * 864e5)
        : null),
      warrantyNotes: warrantyLine,
    });
  }

  return items;
}

function extractWarranty(
  text: string,
  issueDate: Date
): { duration?: number; validUntil?: Date } {
  const lowered = text.toLowerCase();

  const primary =
    /(?:garant[ií]a|vigencia|válida|cubre)\s*(?:por\s*)?(\d+)\s*(d[ií]as?|mes(?:es)?|a(?:ños?)?)/i;
  let match = lowered.match(primary);

  if (!match && /garant[ií]a/i.test(lowered)) {
    match = lowered.match(/(\d+)\s*(d[ií]as?|mes(?:es)?|a(?:ños?)?)/i);
  }

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
