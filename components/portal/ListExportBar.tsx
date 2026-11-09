'use client';

import { toCsv, toExcelHtml, toPrintHtml } from '@/lib/exportLists';

function download(filename: string, body: string, mime: string) {
  const blob = new Blob([`\uFEFF${body}`], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ListExportBar({
  filename,
  title,
  rows,
  labels,
}: {
  filename: string;
  title: string;
  rows: readonly Record<string, unknown>[];
  labels: { csv: string; excel: string; print: string; empty: string };
}) {
  const empty = () => window.alert(labels.empty);
  const csv = () => {
    if (!rows.length) return empty();
    download(`${filename}.csv`, toCsv(rows), 'text/csv;charset=utf-8');
  };
  const excel = () => {
    if (!rows.length) return empty();
    download(`${filename}.xls`, toExcelHtml(title, rows), 'application/vnd.ms-excel');
  };
  const print = () => {
    if (!rows.length) return empty();
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) return;
    popup.document.write(toPrintHtml(title, rows));
    popup.document.close();
    popup.focus();
    popup.print();
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
