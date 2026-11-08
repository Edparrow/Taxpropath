/**
 * Builds a CSV string. Every cell is quoted, and cells that start like a
 * spreadsheet formula (= + - @) are prefixed with ' so opening the export in
 * Excel or Sheets can't run anything a customer typed into a form.
 */
export function toCsv(header: string[], rows: (string | number)[][]): string {
  const cell = (value: string | number) => {
    let text = String(value ?? "");
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  return [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
}
