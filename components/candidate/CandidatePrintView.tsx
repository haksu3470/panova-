'use client';

import type { DocumentPrintRow, OfferPrint } from '@/lib/candidatePrint';

export type CandidatePrintTarget =
  | { kind: 'offer'; offer: OfferPrint }
  | { kind: 'documents'; rows: DocumentPrintRow[] };

export type CandidatePrintLabels = {
  offerTitle: string;
  documentsTitle: string;
  candidate: string;
  printedAt: string;
  position: string;
  employer: string;
  salary: string;
  startDate: string;
  terms: string;
  status: string;
  document: string;
  fileName: string;
  reviewNote: string;
};

/**
 * Print-only sheet for the candidate page. It is hidden on screen
 * (hidden print:block) and the rest of the page is print:hidden, so the tab
 * bar, buttons and other sections are never printed. One offer fits on one
 * page; the document list prints type, status, file name and review note,
 * never the files themselves.
 */
export default function CandidatePrintView({
  target,
  labels,
  candidateName,
  printedAt,
  dir,
}: {
  target: CandidatePrintTarget;
  labels: CandidatePrintLabels;
  candidateName: string;
  printedAt: string;
  dir: 'ltr' | 'rtl';
}) {
  const title = target.kind === 'offer' ? labels.offerTitle : labels.documentsTitle;
  return (
    <section dir={dir} className="candidate-print hidden print:block bg-white text-black p-0 text-sm">
      <style>{'@media print { @page { margin: 16mm; } .candidate-print { break-inside: avoid; } .candidate-print tr { break-inside: avoid; } }'}</style>
      <h1 className="text-xl font-bold mb-1">{title}</h1>
      <p className="mb-4 text-xs">
        {labels.candidate}: <strong>{candidateName || '—'}</strong> · {labels.printedAt}: {printedAt}
      </p>
      {target.kind === 'offer' ? (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
          {([
            [labels.position, target.offer.position],
            [labels.employer, target.offer.employer],
            [labels.salary, target.offer.salary],
            [labels.startDate, target.offer.startDate],
            [labels.terms, target.offer.terms],
            [labels.status, target.offer.status],
          ] as const).map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-bold">{label}</dt>
              <dd>{value || '—'}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {[labels.document, labels.status, labels.fileName, labels.reviewNote].map((head) => (
                <th key={head} className="border border-slate-400 px-2 py-1 text-start bg-slate-100">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {target.rows.map((row, index) => (
              <tr key={`${row.title}-${index}`}>
                <td className="border border-slate-400 px-2 py-1 align-top">{row.title}</td>
                <td className="border border-slate-400 px-2 py-1 align-top">{row.status}</td>
                <td className="border border-slate-400 px-2 py-1 align-top">{row.fileName || '—'}</td>
                <td className="border border-slate-400 px-2 py-1 align-top">{row.reviewNote || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
