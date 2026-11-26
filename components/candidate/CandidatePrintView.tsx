'use client';

import type { DocumentPrintRow, OfferPrint } from '@/lib/candidatePrint';
import type { Language } from '@/lib/dictionary';
import { LETTERHEAD_CSS, letterheadHtml, printFooterHtml, printLabels, signatureHtml } from '@/lib/printLetterhead';

/**
 * signature: the person printing was asked (window.confirm) whether to add
 * signature fields; parties are the boxes printed (offer: candidate and
 * employer; documents: candidate and Panova).
 */
export type CandidatePrintTarget =
  | { kind: 'offer'; offer: OfferPrint; benefits: string[]; docNo: string; signature: boolean }
  | { kind: 'documents'; rows: DocumentPrintRow[]; docNo: string; signature: boolean };

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
 * bar, buttons and other sections are never printed. It carries the Panova
 * letterhead and footer (lib/printLetterhead.ts). @page margin 0 keeps the
 * browser from printing its own header and footer (date, page address); the
 * margin is the sheet's padding. The document list prints type, status, file
 * name and review note, never the files themselves.
 */
export default function CandidatePrintView({
  target,
  labels,
  candidateName,
  printedAt,
  printedBy,
  lang,
  dir,
}: {
  target: CandidatePrintTarget;
  labels: CandidatePrintLabels;
  candidateName: string;
  printedAt: string;
  printedBy: string;
  lang: Language;
  dir: 'ltr' | 'rtl';
}) {
  const pl = printLabels[lang] || printLabels.en;
  const title = target.kind === 'offer' ? labels.offerTitle : labels.documentsTitle;
  const head = letterheadHtml({
    lang,
    origin: typeof window !== 'undefined' ? window.location.origin : '',
    title,
    docNo: target.docNo,
    printedAt,
    printedBy,
  });
  const parties = target.kind === 'offer' ? [pl.signCandidate, pl.signEmployer] : [pl.signCandidate, pl.signPanova];
  return (
    <section dir={dir} className="candidate-print hidden print:block bg-white text-black p-0 text-sm">
      <style>{`@media print { @page { size: A4; margin: 0; } .candidate-print { padding: 14mm 16mm; } .candidate-print tr { break-inside: avoid; } } ${LETTERHEAD_CSS}`}</style>
      <div dangerouslySetInnerHTML={{ __html: head }} />
      <p className="mb-3 text-xs">{labels.candidate}: <strong>{candidateName || '—'}</strong></p>
      {target.kind === 'offer' ? (
        <div className="space-y-4">
          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
            {([
              [labels.position, target.offer.position],
              [pl.offeringEmployer, target.offer.employer],
              [labels.salary, target.offer.salary],
              [labels.startDate, target.offer.startDate],
              [labels.status, target.offer.status],
            ] as const).map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="font-bold">{label}</dt>
                <dd>{value || '—'}</dd>
              </div>
            ))}
          </dl>
          {target.benefits.length > 0 ? (
            <div>
              <h2 className="font-bold mb-1">{pl.benefits}</h2>
              <ul className="list-disc ps-5 space-y-0.5">
                {target.benefits.map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          ) : null}
          {target.offer.terms ? (
            <div>
              <h2 className="font-bold mb-1">{pl.notes}</h2>
              <p className="whitespace-pre-line">{target.offer.terms}</p>
            </div>
          ) : null}
        </div>
      ) : (
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              {[labels.document, labels.status, labels.fileName, labels.reviewNote].map((col) => (
                <th key={col} className="border border-slate-400 px-2 py-1 text-start bg-slate-100">{col}</th>
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
      {target.signature ? <div dangerouslySetInnerHTML={{ __html: signatureHtml(lang, parties) }} /> : null}
      <div dangerouslySetInnerHTML={{ __html: printFooterHtml(lang) }} />
    </section>
  );
}
