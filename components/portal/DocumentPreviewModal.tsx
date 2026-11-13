'use client';

import { useEffect, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { Translation } from '@/lib/dictionary';
import { candidatePreviewUrl, type PreviewUrlResult } from '@/lib/candidateFiles';
import { isDirectFileUrl, isDocumentRowId, previewKind } from '@/lib/documentPreview';

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

type Loaded = PreviewUrlResult | null;

/**
 * Staff document preview. Private storage files are opened through a short
 * signed URL (same helpers as the candidate page); a raw storage path is
 * never put in the frame. Images use <img>, PDFs an iframe, other types a
 * link. Render with a key per document so the state starts fresh.
 */
export default function DocumentPreviewModal({ t, name, fileUrl, fileName, documentId, onClose }: Props) {
  const direct = isDirectFileUrl(fileUrl);
  const kind = previewKind(fileName, fileUrl);
  const [loaded, setLoaded] = useState<Loaded>(direct && !fileUrl.startsWith('data:') ? { ok: true, url: fileUrl } : null);

  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    (async () => {
      let result: PreviewUrlResult;
      if (fileUrl.startsWith('data:')) {
        // Old base64 uploads: a blob URL renders in the frame where a long
        // data: address may be refused.
        try {
          const blob = await (await fetch(fileUrl)).blob();
          objectUrl = URL.createObjectURL(blob);
          result = { ok: true, url: objectUrl };
        } catch {
          result = { ok: true, url: fileUrl };
        }
      } else if (direct) {
        return;
      } else {
        result = await candidatePreviewUrl(fileUrl, isDocumentRowId(documentId) ? documentId : null);
      }
      if (!result.ok) console.error('[document-preview]', result.code, result.detail || '');
      if (alive) setLoaded(result);
    })();
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileUrl, documentId, direct]);

  const reason = loaded && !loaded.ok
    ? loaded.code === 'bad_path'
      ? t.docPreviewErrPath
      : loaded.code === 'no_file'
        ? t.noFileUploaded
        : loaded.code === 'access_denied'
          ? t.docPreviewErrAccess
          : t.docPreviewErrGeneric
    : '';

  const openLink = (url: string) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={url.startsWith('blob:') || url.startsWith('data:') ? (fileName || true) : undefined}
      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
    >
      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" /> {t.docOpenNewTab}
    </a>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={name}>
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center gap-3">
          <h3 className="font-bold text-sm truncate">{name}</h3>
          <div className="flex items-center gap-2 shrink-0">
            {loaded?.ok ? (
              <a href={loaded.url} target="_blank" rel="noopener noreferrer" download={loaded.url.startsWith('blob:') ? (fileName || true) : undefined} className="text-xs font-bold text-white underline hover:text-on-dark-muted">
                {t.docOpenNewTab}
              </a>
            ) : null}
            <button onClick={onClose} aria-label={t.docPreviewClose} className="p-1.5 bg-slate-800 rounded-full text-on-dark-muted cursor-pointer hover:bg-slate-700"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-4 flex-1 overflow-auto flex justify-center items-center bg-slate-100 min-h-[40vh]">
          {loaded === null ? (
            <p role="status" className="text-sm font-bold text-slate-700">{t.plLoading}</p>
          ) : !loaded.ok ? (
            <div role="alert" className="max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-center space-y-1">
              <p className="text-sm font-extrabold text-red-800">{t.docPreviewFailed}</p>
              <p className="text-xs font-semibold text-red-700">{reason}</p>
            </div>
          ) : kind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed or blob URL, not optimisable
            <img src={loaded.url} alt={name} className="max-w-full max-h-[70vh] object-contain rounded-xl bg-white" />
          ) : kind === 'pdf' ? (
            <iframe src={loaded.url} className="w-full h-[70vh] rounded-xl border bg-white" title={name} />
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm font-bold text-slate-700">{t.docPreviewUnsupported}</p>
              {openLink(loaded.url)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
