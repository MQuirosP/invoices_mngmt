export function extractIssueDate(text: string): Date {
  const dateRegex = /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/;
  const match = text.toLowerCase().match(dateRegex);
  return match ? parseDate(match[1]) : new Date();
}

function parseDate(raw: string): Date {
  const [d, m, y] = raw.split(/[\/\-\.]/);
  const parsed = new Date(`${y}-${m}-${d}`);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}