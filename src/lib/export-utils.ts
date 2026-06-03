/**
 * Utility functions for exporting analytics data to CSV and Excel formats.
 */

export interface ExportColumn {
  key: string;
  label: string;
}

export function exportToCSV(data: Record<string, unknown>[], columns: ExportColumn[], filename: string): void {
  if (!data?.length) return;

  const header = columns.map((col) => `"${col.label}"`).join(',');
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.key];
        const escaped = String(value ?? '').replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(',');
  });

  const csv = [header, ...rows].join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(data: Record<string, unknown>[], columns: ExportColumn[], filename: string): void {
  if (!data?.length) return;

  const escapeHtml = (str: string): string =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

  const headerRow = columns
    .map((col) => `<th style="background:#2563eb;color:white;font-weight:bold;">${escapeHtml(col.label)}</th>`)
    .join('');
  const bodyRows = data
    .map((row) => {
      const cells = columns.map((col) => `<td>${escapeHtml(String(row[col.key] ?? ''))}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
    <x:Name>Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
    </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
    <body><table border="1">${headerRow}${bodyRows}</table></body></html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: Record<string, unknown>[], filename: string): void {
  if (!data?.length) return;

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('ru-RU');
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

export function formatNumber(value: number): string {
  return value.toString();
}
