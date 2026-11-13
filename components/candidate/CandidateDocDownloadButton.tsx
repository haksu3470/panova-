'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { candidatePreviewUrl } from '@/lib/candidateFiles';
import { downloadFileName, downloadHref, isDocumentRowId, previewKind } from '@/lib/documentPreview';

interface Props {
  /** Stored file_url of the candidate's own document. */
  fileUrl: string;
  /** Original file name (notes), for the saved name and the file type. */
  fileName?: string | null;
  /** Document title, used when there is no file name. */
  title: string;
  /** candidate_documents id; access is logged like the preview. */
  documentId?: string | null;
  label?: string;
  /** Shown when the address cannot be resolved (no access, missing file). */
  failedText?: string;
}

/**
 * "Download" on the candidate's own document card. Same access path as the
 * preview (candidatePreviewUrl: log_document_access, then a short signed URL
 * from the private bucket, so storage rules decide), then a download link:
 * signed storage URLs get ?download=<name> so the file is saved, not shown.
 */
export default function CandidateDocDownloadButton({ fileUrl, fileName, title, documentId, label, failedText }: Props) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const resolved = await candidatePreviewUrl(fileUrl, isDocumentRowId(documentId) ? documentId : null);
      if (!resolved.ok) {
        console.error('[document-download]', resolved.code, resolved.detail || '');
        if (failedText) window.alert(failedText);
        return;
      }
      const name = downloadFileName(fileName, title, previewKind(fileName, fileUrl));
      const link = document.createElement('a');
      link.href = downloadHref(resolved.url, name);
      link.download = name;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-slate-900 font-bold rounded-xl text-xs hover:bg-slate-50 transition shrink-0 cursor-pointer disabled:bg-slate-100 disabled:cursor-wait"
    >
      <Download className="w-3.5 h-3.5" aria-hidden="true" /> {label}
    </button>
  );
}
