'use client';

import { toCsv, toExcelHtml, toPrintHtml } from '@/lib/exportLists';
import { writeAudit } from '@/lib/audit';
import { renameColumns } from '@/lib/exportColumns';
import { printHtmlInNewWindow } from '@/lib/printWindow';

function download(filename: string, body: string, mime: string) {
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
 * loaded. The caller decides which columns a row has (lib/exportLists.ts).
 *
 * audit: staff exports are written to audit_logs (default). Employer and
 * candidate pages pass audit={false}: that table only accepts staff inserts.
 * columnLabels: optional key -> heading map (lib/exportColumns.ts).
 */
export default function ListExportBar({
  filename,
  title,
  rows,
  labels,
  audit = true,
  columnLabels,
  dir = 'ltr',
}: {
  filename: string;
  title: string;
  rows: readonly Record<string, unknown>[];
  labels: { csv: string; excel: string; print: string; empty: string; popupBlocked?: string };
  audit?: boolean;
  columnLabels?: Record<string, string>;
  dir?: 'ltr' | 'rtl';
}) {
  const out = () => (columnLabels ? renameColumns(rows, columnLabels) : rows);
  const empty = () => window.alert(labels.empty);
  const record = (kind: string) => {
    if (!audit) return;
    void writeAudit(`Dışa aktarma: ${kind}`, 'export', undefined, { filename, rows: rows.length, columns: rows[0] ? Object.keys(rows[0]) : [] });
  };
  const csv = () => {
    if (!rows.length) return empty();
    download(`${filename}.csv`, toCsv(out()), 'text/csv;charset=utf-8');
    record('csv');
  };
  const excel = () => {
    if (!rows.length) return empty();
    download(`${filename}.xls`, toExcelHtml(title, out()), 'application/vnd.ms-excel');
    record('excel');
  };
  const print = () => {
    if (!rows.length) return empty();
    if (!printHtmlInNewWindow(toPrintHtml(title, out(), dir))) {
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
