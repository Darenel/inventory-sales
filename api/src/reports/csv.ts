export type CsvValue = Date | number | string | null | undefined;

export function buildCsv(headers: string[], rows: CsvValue[][]) {
  return [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\r\n') + '\r\n';
}

export function escapeCsvValue(value: CsvValue) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = value instanceof Date ? value.toISOString() : String(value);

  if (!/[",\r\n]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}
