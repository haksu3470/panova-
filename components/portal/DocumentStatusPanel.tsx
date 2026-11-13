'use client';

import { useState } from 'react';
import type { Translation } from '@/lib/dictionary';
import type { PortalUi } from '@/lib/portal-ui-copy';
import {
  documentCounts,
  documentTypeTitle,
  isApprovedWithoutFile,
  REQUESTABLE_DOC_TYPES,
  type CandidateDocumentRow,
  type DocumentListItem,
} from '@/lib/candidateDocuments';
import { requestCandidateDocument } from '@/lib/candidateDocumentActions';

interface Props {
  candidateId: string;
  /** The same list the document section shows (mergeDocumentSlots). */
  items: DocumentListItem[];
  rows: CandidateDocumentRow[];
  reload: () => Promise<void>;
  t: Translation;
  ui: PortalUi;
}

/**
 * Summary of the staff document list: approved = approved with a file,
 * total = every line of that list (five slots + other rows). Editing happens
 * in the list itself; this card only counts and can request a new type.
 */
export default function DocumentStatusPanel({ candidateId, items, rows, reload, t, ui }: Props) {
  const [newType, setNewType] = useState<string>('photo');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const { total, approved } = documentCounts(items.map((item) => ({ status: item.status, file_url: item.file_url })));
  const title = (docType: string) => documentTypeTitle(docType, t, ui.docTypes);

  const request = async () => {
    setBusy(true);
    setMessage(null);
    const result = await requestCandidateDocument(candidateId, newType, rows, `${ui.docRequest} ${title(newType)}`);
    if (result.ok) await reload();
    setBusy(false);
    setMessage(result.ok
      ? { kind: 'ok', text: t.docRequestedOk || '' }
      : { kind: 'error', text: (result.code === 'denied' ? t.docNoPermission : result.code === 'already' ? t.docAlreadyRequested : t.docSaveFailed) || '' });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex justify-between items-center gap-2">
        <span className="flex items-center gap-1.5">📄 {ui.docTitle}</span>
        <span className="text-xs text-slate-600 font-bold">{approved}/{total} {ui.docApproved}</span>
      </h3>

      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-800 truncate">{title(item.docType)}</span>
            <span className="flex items-center gap-1 shrink-0">
              {item.row && isApprovedWithoutFile(item.row) ? <span className="font-bold text-red-700">⚠️ {t.docNoFileShort}</span> : null}
              <span className="font-bold text-slate-700 bg-slate-100 rounded-md px-2 py-0.5">
                {item.status ? (ui.docStatuses[item.status] || item.status) : t.docNotRequested}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <select
          value={newType}
          onChange={(e) => { setNewType(e.target.value); setMessage(null); }}
          aria-label={ui.docRequest}
          className="flex-1 text-xs font-bold border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-slate-900 outline-none cursor-pointer"
        >
          {REQUESTABLE_DOC_TYPES.map((key) => <option key={key} value={key}>{title(key)}</option>)}
        </select>
        <button onClick={request} disabled={busy} className="text-xs font-bold px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow disabled:cursor-wait">
          {ui.docRequest}
        </button>
      </div>
      {message ? (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={`text-[11px] font-bold ${message.kind === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>{message.text}</p>
      ) : null}
    </div>
  );
}
