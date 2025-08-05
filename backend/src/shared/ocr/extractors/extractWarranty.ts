export function extractWarranty(
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
