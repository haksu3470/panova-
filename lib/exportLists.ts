import type { Language } from './dictionary';
import { offerAmount, offerCurrency } from './offers';
import { localizeCatalogTitle, professionLabel } from './professions';

function cell(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

/** Spreadsheet apps treat a leading = + - @ as a formula. A leading quote keeps it text. */
export function neutralizeSpreadsheetFormula(value: unknown): string {
  const text = cell(value);
  if (/^[=+\-@]/.test(text)) return `'${text}`;
  return text;
}

function escapeCsv(value: unknown): string {
  const text = neutralizeSpreadsheetFormula(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function toCsv(rows: readonly Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => escapeCsv(row[key])).join(',')),
  ];
  return lines.join('\r\n');
}

function escapeHtml(value: unknown): string {
  return cell(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function toExcelHtml(title: string, rows: readonly Record<string, unknown>[]): string {
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const head = headers.map((key) => `<th>${escapeHtml(key)}</th>`).join('');
  const body = rows.map((row) => (
    `<tr>${headers.map((key) => `<td>${escapeHtml(neutralizeSpreadsheetFormula(row[key]))}</td>`).join('')}</tr>`
  )).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

export function toPrintHtml(title: string, rows: readonly Record<string, unknown>[]): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
  h1 { font-size: 18px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: start; vertical-align: top; }
  th { background: #f1f5f9; }
</style></head><body><h1>${escapeHtml(title)}</h1>${toExcelHtml(title, rows).replace(/^[\s\S]*<table>/, '<table>').replace(/<\/table>[\s\S]*$/, '</table>')}</body></html>`;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

/** Catalog key -> label in the export language; free text stays as entered. */
function professionCell(value: unknown, lang: Language): string {
  const raw = text(value).trim();
  return professionLabel(raw, lang) ?? raw;
}

export function candidateExportRows(rows: readonly Record<string, unknown>[], lang: Language = 'tr'): Record<string, unknown>[] {
  return rows.map((row) => ({
    id: row.id ?? '',
    full_name: row.full_name ?? '',
    nationality: row.nationality ?? row.country ?? '',
    profession: professionCell(row.profession, lang),
    sector: row.sector ?? '',
    status: row.status ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    is_demo: row.is_demo === true,
  }));
}

export function employerExportRows(rows: readonly Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => ({
    id: row.id ?? '',
    company_name: row.company_name ?? '',
    contact_person: row.contact_person ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    country: row.country ?? '',
    city: row.city ?? '',
    is_demo: row.is_demo === true,
  }));
}

export function requestExportRows(rows: readonly Record<string, unknown>[], lang: Language = 'tr'): Record<string, unknown>[] {
  return rows.map((row) => ({
    id: row.id ?? '',
    employer_name: row.employer_name ?? '',
    position_title: localizeCatalogTitle(text(row.position_title), lang),
    headcount: row.headcount ?? '',
    country: row.country ?? '',
    city: row.city ?? '',
    monthly_net_salary: offerAmount(row),
    status: row.status ?? '',
    is_demo: row.is_demo === true,
  }));
}

export function offerExportRows(rows: readonly Record<string, unknown>[], lang: Language = 'tr'): Record<string, unknown>[] {
  return rows.map((row) => ({
    id: row.id ?? '',
    candidate_id: row.candidate_id ?? '',
    employer_name: row.employer_name ?? '',
    position_title: localizeCatalogTitle(text(row.position_title), lang),
    monthly_net_salary: offerAmount(row),
    currency: offerCurrency(row),
    status: row.status ?? '',
    start_date: row.start_date ?? '',
    terms_details: row.terms_details ?? '',
    is_demo: row.is_demo === true,
  }));
}
