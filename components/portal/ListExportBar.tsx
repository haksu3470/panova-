'use client';

import { toCsv, toExcelHtml, toPrintHtml } from '@/lib/exportLists';
import { writeAudit } from '@/lib/audit';
import type { Language } from '@/lib/dictionary';
import { EXPORT_COLUMN_LABELS, isVisibleExportColumn } from '@/lib/exportColumns';
import { printHtmlInNewWindow } from '@/lib/printWindow';
import { dateLocale } from '@/lib/portal-ui-copy';

/** Saves a text file with a UTF-8 BOM (Excel reads ç, ş, Cyrillic and Arabic from it). */
export function downloadTextFile(filename: string, body: string, mime: string) {
  const blob = new Blob([`﻿${body}`], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * CSV, Excel (.xls HTML table) and Print / PDF for a list the page already
 * loaded. The caller decides which columns a row has (lib/exportLists.ts);
 * headings come from lib/exportColumns.ts in `lang`, and internal columns
 * (EXPORT_HIDDEN_COLUMNS: id, is_demo, …) are dropped from every output.
 *
 * audit: staff exports are written to audit_logs (default). Employer and
 * candidate pages pass audit={false}: that table only accepts staff inserts.
 */
export default function ListExportBar({
  filename,
  title,
  rows,
  labels,
  lang,
  audit = true,
  dir = 'ltr',
}: {
  filename: string;
  title: string;
  rows: readonly Record<string, unknown>[];
  labels: { csv: string; excel: string; print: string; empty: string; popupBlocked?: string };
  lang: Language;
  audit?: boolean;
  dir?: 'ltr' | 'rtl';
}) {
  const options = { labels: EXPORT_COLUMN_LABELS[lang] as Record<string, string> };
  const dated = () => `${title} · ${new Date().toLocaleDateString(dateLocale[lang])}`;
  const empty = () => window.alert(labels.empty);
  const record = (kind: string) => {
    if (!audit) return;
    void writeAudit(`Dışa aktarma: ${kind}`, 'export', undefined, {
      filename,
      rows: rows.length,
      columns: rows[0] ? Object.keys(rows[0]).filter(isVisibleExportColumn) : [],
    });
  };
  const csv = () => {
    if (!rows.length) return empty();
    downloadTextFile(`${filename}.csv`, toCsv(rows, options), 'text/csv;charset=utf-8');
    record('csv');
  };
  const excel = () => {
    if (!rows.length) return empty();
    downloadTextFile(`${filename}.xls`, toExcelHtml(dated(), rows, options), 'application/vnd.ms-excel');
    record('excel');
  };
  const print = () => {
    if (!rows.length) return empty();
    if (!printHtmlInNewWindow(toPrintHtml(dated(), rows, dir, options))) {
      if (labels.popupBlocked) window.alert(labels.popupBlocked);
      return;
    }
    record('print');
  };
  const button = 'px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold hover:bg-slate-50 cursor-pointer';
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={csv} className={button}>{labels.csv}</button>
      <button type="button" onClick={excel} className={button}>{labels.excel}</button>
      <button type="button" onClick={print} className={button}>{labels.print}</button>
    </div>
  );
}
