import { parse, isValid } from "date-fns";
import { es } from "date-fns/locale";

export function extractIssueDate(text: string): Date {
  const dateRegex = /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/;
  const match = text.toLowerCase().match(dateRegex);
  if (!match) throw new Error("No valid issue date found");

  const raw = match[1];
  const formats = ["dd/MM/yyyy", "dd-MM-yyyy", "dd.MM.yyyy", "yyyy-MM-dd"];
  for (const format of formats) {
    const parsed = parse(raw, format, new Date(), { locale: es });
    if (isValid(parsed)) return parsed;
  }

  throw new Error(`Failed to parse issue date: ${raw}`);
}