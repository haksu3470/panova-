'use client';

import { useEffect, useState } from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import type { Translation } from '@/lib/dictionary';
import { candidatePdfBlob, candidatePreviewUrl } from '@/lib/candidateFiles';
import {
  dataUrlByteSize,
  downloadFileName,
  downloadHref,
  isDirectFileUrl,
  isDocumentRowId,
  objectUrlHolder,
  openInTabDownloadAttr,
  previewKind,
  previewStrategy,
} from '@/lib/documentPreview';

interface Props {
  t: Translation;
  /** Title shown in the header. */
  name: string;
  /** Stored file_url: data:, http(s): or a private storage reference. */
  fileUrl: string;
  /** Original file name (file_name / notes), used to tell image from PDF. */
  fileName?: string | null;
  /** candidate_documents id, when the row comes from that table (access is logged). */
  documentId?: string | null;
  onClose: () => void;
}

type ErrorCode = 'no_file' | 'bad_path' | 'access_denied' | 'sign_failed' | 'fetch_failed' | 'not_pdf';

type View =
  | { state: 'loading' }
  | { state: 'ready'; url: string }
  | { state: 'too_large'; url: string }
  /** url: the resolved address, when there is one, for the Download button. */
  | { state: 'error'; code: ErrorCode; url?: string };

/**
 * Staff document preview.
 *
 * Private storage files are opened through a short signed URL
 * (candidatePreviewUrl: same bucket and the same log_document_access call as
 * the candidate page). Images use that URL in <img>. PDFs are never framed
 * from the storage URL or a data: address: storage serves files with a
 * sandbox CSP that Chrome's PDF viewer refuses inside a frame. The PDF is
 * fetched, checked ("%PDF-"), rebuilt as an application/pdf Blob and shown
 * from a blob: URL in <object type="application/pdf"> (no sandbox; the site
 * CSP allows blob: in frame-src and object-src for this). The blob: URL is
 * revoked on close or unmount.
 *
 * "Open in new tab" opens the address with no download attribute; "Download"
 * is a separate link. If the PDF cannot be shown, <object> renders its
 * fallback: a short message with both links, never an empty frame.
 *
 * Render with a key per document so the state starts fresh.
 */
export default function DocumentPreviewModal({ t, name, fileUrl, fileName, documentId, onClose }: Props) {
  const kind = previewKind(fileName, fileUrl);
  const plainDirect = isDirectFileUrl(fileUrl) && kind !== 'pdf';
  const [view, setView] = useState<View>(plainDirect ? { state: 'ready', url: fileUrl } : { state: 'loading' });
  const fileLabel = downloadFileName(fileName, name, kind);

  useEffect(() => {
    if (plainDirect) return;
    let alive = true;
    const holder = objectUrlHolder((blob) => URL.createObjectURL(blob), (url) => URL.revokeObjectURL(url));
    const fail = (code: ErrorCode, detail?: string, url?: string) => {
      console.error('[document-preview]', code, detail || '');
      if (alive) setView({ state: 'error', code, url });
    };
    (async () => {
      const resolved = await candidatePreviewUrl(fileUrl, isDocumentRowId(documentId) ? documentId : null);
      if (!resolved.ok) return fail(resolved.code, resolved.detail);
      if (kind !== 'pdf') {
        if (alive) setView({ state: 'ready', url: resolved.url });
        return;
      }
      if (previewStrategy(kind, dataUrlByteSize(resolved.url)) === 'too_large') {
        if (alive) setView({ state: 'too_large', url: resolved.url });
        return;
      }
      const pdf = await candidatePdfBlob(resolved.url, resolved.path);
      if (!alive) return;
      if (!pdf.ok) {
        if (pdf.code === 'too_large') {
          setView({ state: 'too_large', url: resolved.url });
          return;
        }
        return fail(pdf.code, pdf.detail, resolved.url);
      }
      setView({ state: 'ready', url: holder.set(pdf.blob) });
    })().catch((error) => fail('fetch_failed', error instanceof Error ? error.message : String(error)));
    return () => {
      alive = false;
      holder.clear();
    };
  }, [fileUrl, documentId, kind, plainDirect]);

  const reason = view.state === 'error'
    ? view.code === 'bad_path'
      ? t.docPreviewErrPath
      : view.code === 'no_file'
        ? t.noFileUploaded
        : view.code === 'access_denied'
          ? t.docPreviewErrAccess
          : view.code === 'not_pdf'
            ? t.docPreviewErrNotPdf
            : view.code === 'fetch_failed'
              ? t.docPreviewErrFetch
              : t.docPreviewErrGeneric
    : '';

  const openLink = (url: string) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={openInTabDownloadAttr(url, fileLabel)}
      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
    >
      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> {t.docOpenNewTab}
    </a>
  );
  const downloadLink = (url: string) => (
    <a
      href={downloadHref(url, fileLabel)}
      download={fileLabel}
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-50"
    >
      <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t.docDownload}
    </a>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={name}>
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center gap-3">
          <h3 className="font-bold text-sm truncate">{name}</h3>
          <div className="flex items-center gap-3 shrink-0">
            {view.state === 'ready' ? (
              <>
                <a href={view.url} target="_blank" rel="noopener noreferrer" download={openInTabDownloadAttr(view.url, fileLabel)} className="inline-flex items-center gap-1 text-xs font-bold text-white underline hover:text-on-dark-muted">
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> {t.docOpenNewTab}
                </a>
                <a href={downloadHref(view.url, fileLabel)} download={fileLabel} rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-white underline hover:text-on-dark-muted">
                  <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t.docDownload}
                </a>
              </>
            ) : null}
            <button onClick={onClose} aria-label={t.docPreviewClose} className="p-1.5 bg-slate-800 rounded-full text-on-dark-muted cursor-pointer hover:bg-slate-700"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-4 flex-1 overflow-auto flex justify-center items-center bg-slate-100 min-h-[40vh]">
          {view.state === 'loading' ? (
            <p role="status" className="text-sm font-bold text-slate-700">{t.plLoading}</p>
          ) : view.state === 'error' ? (
            <div role="alert" className="max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-center space-y-2">
              <p className="text-sm font-extrabold text-red-800">{t.docPreviewFailed}</p>
              <p className="text-xs font-semibold text-red-700">{reason}</p>
              {view.url ? <div className="pt-1">{downloadLink(view.url)}</div> : null}
            </div>
          ) : view.state === 'too_large' ? (
            <div className="max-w-md text-center space-y-3">
              <p className="text-sm font-bold text-slate-700">{t.docPreviewTooLarge}</p>
              <div className="flex flex-wrap justify-center gap-2">{openLink(view.url)}{downloadLink(view.url)}</div>
            </div>
          ) : kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed URL, not optimisable
            <img src={view.url} alt={name} className="max-w-full max-h-[70vh] object-contain rounded-xl bg-white" />
          ) : kind === 'pdf' ? (
            // blob: URL of a checked PDF rebuilt as application/pdf. No
            // sandbox: Chrome does not run its PDF viewer in a sandboxed frame.
            // When the viewer cannot run (blocked, or no viewer, as on most
            // phones) the browser shows the fallback inside instead.
            <object data={view.url} type="application/pdf" aria-label={name} className="w-full h-[70vh] rounded-xl border bg-white">
              <div role="alert" className="h-full flex flex-col items-center justify-center gap-3 p-4 text-center">
                <p className="text-sm font-bold text-slate-700">{t.docPreviewPdfFallback}</p>
                <div className="flex flex-wrap justify-center gap-2">{openLink(view.url)}{downloadLink(view.url)}</div>
              </div>
            </object>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm font-bold text-slate-700">{t.docPreviewUnsupported}</p>
              <div className="flex flex-wrap justify-center gap-2">{openLink(view.url)}{downloadLink(view.url)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
