import { translations, type Language } from './dictionary';
import { demandStatusLabel } from './demandStatus';
import { officialProcessText } from './employerPlacements';
import { EUROPEAN_COUNTRIES } from './europeanCountries';
import { isVisibleExportColumn } from './exportColumns';
import { requestCurrency, salaryAmount } from './money';
import { offerAmount, offerCurrency, offerStatusLabel } from './offers';
import { dateLocale, portalUi } from './portal-ui-copy';
import { localizeCatalogTitle, professionLabel, sectorLabel } from './professions';

type Row = Record<string, unknown>;

/** Column key -> heading (lib/exportColumns.ts). Keys without a heading are written as they are. */
export type ExportTableOptions = { labels?: Record<string, string> };

/** Columns kept as text in Excel (no number conversion, leading + kept). */
const TEXT_COLUMNS = new Set(['phone']);

/**
 * CSV field separator. Semicolon, because Excel set to Turkish (and the
 * other European locales of our users) splits a double-clicked CSV on its
 * list separator, which is ";". A "sep=," first line would also work, but
 * Excel then ignores the UTF-8 BOM and breaks ç, ş, ğ, Cyrillic and Arabic.
 */
export const CSV_SEPARATOR = ';';

function cell(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

/** "+90 545 364 49 30", "-1", "(0212) 555-12-12": digits with phone punctuation only. */
const PHONE_LIKE = /^[+-][\d\s().-]*\d[\d\s().-]*$/;

/**
 * Spreadsheet apps run a cell that starts with = + - @ (or a tab / CR) as a
 * formula. Those cells get a leading quote so they stay text. A value that
 * starts with + or - but is only a phone number or a plain number is safe and
 * stays as written, so "+389 70 385 792" is not shown as "'+389…".
 */
export function neutralizeSpreadsheetFormula(value: unknown): string {
  const text = cell(value);
  if (/^[=@\t\r]/.test(text)) return `'${text}`;
  if (/^[+-]/.test(text) && !PHONE_LIKE.test(text)) return `'${text}`;
  return text;
}

function visibleKeys(rows: readonly Row[]): string[] {
  return rows[0] ? Object.keys(rows[0]).filter(isVisibleExportColumn) : [];
}

function heading(key: string, options?: ExportTableOptions): string {
  return options?.labels?.[key] || key;
}

function escapeCsv(value: unknown): string {
  const text = neutralizeSpreadsheetFormula(value);
  if (/[";,\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

/** CSV with ";" between fields and CRLF lines. The caller adds the UTF-8 BOM. Internal columns are dropped. */
export function toCsv(rows: readonly Row[], options?: ExportTableOptions): string {
  if (!rows.length) return '';
  const keys = visibleKeys(rows);
  const lines = [
    keys.map((key) => escapeCsv(heading(key, options))).join(CSV_SEPARATOR),
    ...rows.map((row) => keys.map((key) => escapeCsv(row[key])).join(CSV_SEPARATOR)),
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

/** Column width in points for Excel: the longest heading or value, within 60–300 pt. */
function columnWidth(key: string, rows: readonly Row[], options?: ExportTableOptions): number {
  const longest = Math.max(
    heading(key, options).length,
    ...rows.map((row) => Math.max(...cell(row[key]).split(/\r?\n/).map((line) => line.length))),
  );
  return Math.min(300, Math.max(60, Math.round(longest * 7 + 16)));
}

/**
 * Excel (.xls) as an HTML table: bold headings, set column widths, phone
 * cells as text (mso-number-format "\@"). Internal columns are dropped.
 */
export function toExcelHtml(title: string, rows: readonly Row[], options?: ExportTableOptions): string {
  const keys = visibleKeys(rows);
  const cols = keys.map((key) => {
    const width = columnWidth(key, rows, options);
    return `<col width="${Math.round(width * 4 / 3)}" style="width:${width}pt">`;
  }).join('');
  const head = keys.map((key) => `<th style="font-weight:bold;background:#f1f5f9;text-align:left">${escapeHtml(heading(key, options))}</th>`).join('');
  const body = rows.map((row) => (
    `<tr>${keys.map((key) => {
      const style = TEXT_COLUMNS.has(key) ? ' style="mso-number-format:\'\\@\'"' : '';
      return `<td${style}>${escapeHtml(neutralizeSpreadsheetFormula(row[key]))}</td>`;
    }).join('')}</tr>`
  )).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><table border="1"><colgroup>${cols}</colgroup><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}

/**
 * Printable page: landscape, the table fits the printable width, headings
 * repeat on every page and long cells wrap. Values are printed as they are:
 * the formula guard is for spreadsheets only, so no quote is ever added here.
 *
 * @page margin 0 keeps Chrome and Edge from printing their own header and
 * footer (the blank window's "about:blank" address); the page margin is
 * rebuilt with body padding and the repeated spacer rows.
 */
export function toPrintHtml(title: string, rows: readonly Row[], dir: 'ltr' | 'rtl' = 'ltr', options?: ExportTableOptions): string {
  const keys = visibleKeys(rows);
  const span = Math.max(1, keys.length);
  const head = keys.map((key) => `<th>${escapeHtml(heading(key, options))}</th>`).join('');
  const body = rows.map((row) => `<tr>${keys.map((key) => `<td>${escapeHtml(row[key])}</td>`).join('')}</tr>`).join('');
  return `<!DOCTYPE html><html dir="${dir}"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  @page { size: A4 landscape; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { font-family: Arial, sans-serif; color: #0f172a; padding: 0 12mm; }
  h1 { font-size: 16px; margin: 12mm 0 4mm; }
  table { border-collapse: collapse; width: 100%; max-width: 100%; table-layout: auto; font-size: 10px; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: start; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; white-space: normal; }
  th { background: #f1f5f9; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  .spacer td { border: 0; padding: 0; height: 8mm; background: none; }
  @media screen { body { padding: 0 24px; } h1 { margin-top: 24px; } .spacer { display: none; } }
</style></head><body><h1>${escapeHtml(title)}</h1><table><thead><tr class="spacer"><td colspan="${span}"></td></tr><tr>${head}</tr></thead><tfoot><tr class="spacer"><td colspan="${span}"></td></tr></tfoot><tbody>${body}</tbody></table></body></html>`;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

/** Catalog key -> label in the export language; free text stays as entered. */
function professionCell(value: unknown, lang: Language): string {
  const raw = text(value).trim();
  return professionLabel(raw, lang) ?? raw;
}

/** Sector key or legacy label -> catalog label in the export language; unknown text stays. */
export function exportSector(value: unknown, lang: Language): string {
  const raw = text(value).trim();
  return (raw && sectorLabel(raw, lang)) || raw;
}

/** A country stored by name (any of our five languages) -> its name in `lang`; unknown names stay. */
export function exportCountry(value: unknown, lang: Language): string {
  const raw = text(value).trim();
  if (!raw) return '';
  const folded = raw.toLocaleLowerCase('en');
  const match = EUROPEAN_COUNTRIES.find((country) => (
    country.value.toLocaleLowerCase('en') === folded
    || Object.values(country.names).some((name) => name.toLocaleLowerCase('en') === folded)
  ));
  return match ? match.names[lang] : raw;
}

/** Date (or timestamp) as a calendar day in the export language, e.g. 01.12.2026 / 01/12/2026. */
export function exportDate(value: unknown, lang: Language): string {
  const raw = text(value).trim();
  const day = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (!day) return raw;
  const date = new Date(Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3])));
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat(dateLocale[lang], { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(date);
}

/** Amount as a number in the export language ("1.300", "1,300"); the currency has its own column. */
export function exportAmount(value: unknown, lang: Language): string {
  const amount = salaryAmount(value);
  if (amount === null) return text(value).trim();
  return new Intl.NumberFormat(dateLocale[lang], { maximumFractionDigits: 2 }).format(amount);
}

/** job_requests.status in the export language (the portal's stage names). */
export function requestStatusText(status: unknown, lang: Language): string {
  const t = translations[lang] || translations.tr;
  const raw = text(status).trim();
  if (!raw) return '';
  return demandStatusLabel(raw, {
    new_request: t.stageNewRequest,
    reviewing: t.stageReviewing,
    searching_candidates: t.stageSearchingCandidates,
    presenting_candidates: t.stagePresentingCandidates,
    interviews: t.stageInterviews,
    selection_completed: t.stageSelectionCompleted,
    official_process: t.stageOfficialProcess,
    travel_planning: t.stageTravelPlanning,
    completed: t.stageCompleted,
    cancelled: t.stageCancelled,
  });
}

/**
 * Column names and labels for the two status columns of the candidate export.
 * "Aday durumu" is job_candidates.status (the staff's assessment);
 * "Resmî süreç" is official_process_status as "<step> · n/8".
 */
export type CandidateExportCopy = {
  candidateStatus: string;
  officialProcess: string;
  statusLabels: Record<string, string>;
  steps: Record<string, string>;
  stopped: string;
};

const DEFAULT_CANDIDATE_EXPORT_COPY: CandidateExportCopy = {
  candidateStatus: 'candidate_status',
  officialProcess: 'official_process',
  statusLabels: {},
  steps: {},
  stopped: 'rejected',
};

export function candidateExportRows(
  rows: readonly Row[],
  lang: Language = 'tr',
  copy: CandidateExportCopy = DEFAULT_CANDIDATE_EXPORT_COPY,
): Row[] {
  return rows.map((row) => {
    const status = text(row.status).trim();
    return {
      full_name: row.full_name ?? '',
      nationality: exportCountry(row.nationality ?? row.country, lang),
      profession: professionCell(row.profession, lang),
      sector: exportSector(row.sector, lang),
      [copy.candidateStatus]: copy.statusLabels[status] || status,
      [copy.officialProcess]: officialProcessText(text(row.official_process_status), copy.steps, copy.stopped),
      email: row.email ?? '',
      phone: row.phone ?? '',
    };
  });
}

export function employerExportRows(rows: readonly Row[], lang: Language = 'tr'): Row[] {
  return rows.map((row) => ({
    company_name: row.company_name ?? '',
    contact_person: row.contact_person ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    country: exportCountry(row.country, lang),
    city: row.city ?? '',
  }));
}

export function requestExportRows(rows: readonly Row[], lang: Language = 'tr'): Row[] {
  return rows.map((row) => ({
    employer_name: row.employer_name ?? '',
    position_title: localizeCatalogTitle(text(row.position_title), lang),
    sector: exportSector(row.sector, lang),
    headcount: row.headcount ?? '',
    country: exportCountry(row.country, lang),
    city: row.city ?? '',
    monthly_net_salary: exportAmount(offerAmount(row), lang),
    currency: offerAmount(row) ? requestCurrency(row) : '',
    target_start_date: exportDate(row.target_start_date, lang),
    status: requestStatusText(row.status, lang),
  }));
}

export function offerExportRows(rows: readonly Row[], lang: Language = 'tr'): Row[] {
  const labels = portalUi[lang].offerStatus as Record<string, string>;
  return rows.map((row) => ({
    employer_name: row.employer_name ?? '',
    position_title: localizeCatalogTitle(text(row.position_title), lang),
    monthly_net_salary: exportAmount(offerAmount(row), lang),
    currency: offerCurrency(row),
    status: offerStatusLabel(text(row.status), labels),
    start_date: exportDate(row.start_date, lang),
    terms_details: row.terms_details ?? '',
  }));
}
