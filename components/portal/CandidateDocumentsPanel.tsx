'use client';

import { useState } from 'react';
import { Eye, FileCheck, FileText, Upload } from 'lucide-react';
import type { Translation } from '@/lib/dictionary';
import type { PortalUi } from '@/lib/portal-ui-copy';
import type { ReleaseCopy } from '@/lib/release-copy';
import DeleteRecordButton from './DeleteRecordButton';
import DemoBadge from './DemoBadge';
import {
  canPickDocumentStatus,
  DOC_STATUS_KEYS,
  documentTypeTitle,
  isApprovedWithoutFile,
  type CandidateDocumentRow,
  type DocumentListItem,
} from '@/lib/candidateDocuments';
import {
  requestCandidateDocument,
  updateCandidateDocument,
  uploadStaffDocument,
  type DocumentWriteResult,
} from '@/lib/candidateDocumentActions';

export interface DocumentPreviewRequest {
  key: string;
  name: string;
  fileUrl: string;
  fileName?: string;
  documentId?: string;
}

interface Props {
  candidateId: string;
  items: DocumentListItem[];
  rows: CandidateDocumentRow[];
  loaded: boolean;
  loadError: string;
  reload: () => Promise<void>;
  t: Translation;
  ui: PortalUi;
  copy: ReleaseCopy;
  /** Upper management only (RLS allows DELETE only for is_portal_manager). */
  canDelete: boolean;
  onPreview: (doc: DocumentPreviewRequest) => void;
}

type Message = { kind: 'ok' | 'error'; text: string };

/**
 * Staff document list over candidate_documents: five standard slots (virtual
 * until requested or uploaded) plus every other row. Every change saves at
 * once and reports in the row; nothing waits for "Save changes".
 */
export default function CandidateDocumentsPanel({
  candidateId, items, rows, loaded, loadError, reload, t, ui, copy, canDelete, onPreview,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message>>({});

  const title = (docType: string) => documentTypeTitle(docType, t, ui.docTypes);
  const statusName = (key: string) => ui.docStatuses[key] || key;

  const errorText = (result: Extract<DocumentWriteResult, { ok: false }>) => {
    if (result.code === 'denied') return t.docNoPermission || '';
    if (result.code === 'type') return copy.uploadType;
    if (result.code === 'size') return copy.uploadSize;
    if (result.code === 'empty') return copy.uploadFailed;
    if (result.code === 'already') return t.docAlreadyRequested || '';
    return t.docSaveFailed || '';
  };

  const run = async (key: string, action: () => Promise<DocumentWriteResult>, okText: string) => {
    setBusy(key);
    setMessages((m) => ({ ...m, [key]: { kind: 'ok', text: t.plLoading || '' } }));
    const result = await action();
    if (result.ok) await reload();
    setBusy(null);
    // A request or upload on a virtual slot creates a row with a new key.
    setMessages((m) => ({ ...m, [key]: result.ok ? { kind: 'ok', text: okText } : { kind: 'error', text: errorText(result) } }));
  };

  const upload = (item: DocumentListItem, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const key = item.slot ? `slot:${item.docType}` : item.key;
    void run(key, () => uploadStaffDocument(candidateId, item.docType, file, rows, `${ui.docTitle} ${title(item.docType)}: ${statusName('uploaded')}`), t.docUploadedOk || '');
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-600" aria-hidden="true" /> {t.documentTrackingMechanism}
        </h3>
      </div>
      {loadError ? <p role="alert" className="text-xs font-bold text-red-700">{loadError}</p> : null}
      {!loaded ? <p role="status" className="text-xs font-semibold text-slate-600">{t.plLoading}</p> : null}

      <div className="space-y-3">
        {items.map((item) => {
          const row = item.row;
          const name = title(item.docType);
          // Slots keep one key before and after their row exists.
          const msgKey = item.slot ? `slot:${item.docType}` : item.key;
          const message = messages[msgKey];
          const isBusy = busy === msgKey;
          const hintId = `doc-hint-${item.key}`;
          return (
            <div key={item.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-indigo-600 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">{name} <DemoBadge show={row?.is_demo} /></div>
                    {row?.notes && row.file_url ? <div className="text-[11px] text-slate-600 font-medium truncate max-w-[240px]">{t.file}: {row.notes}</div> : null}
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-1">
                  {row ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={row.status || 'pending'}
                        disabled={isBusy}
                        aria-label={`${name}: ${ui.docTitle}`}
                        aria-describedby={canPickDocumentStatus('approved', row) ? undefined : hintId}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (!canPickDocumentStatus(next, row)) return;
                          void run(msgKey, () => updateCandidateDocument(row, { status: next }, `${ui.docTitle} ${name}: ${statusName(next)}`), t.docSaved || '');
                        }}
                        className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase cursor-pointer outline-none bg-amber-100 text-amber-900 border-amber-300"
                      >
                        {DOC_STATUS_KEYS.map((key) => (
                          <option key={key} value={key} disabled={!canPickDocumentStatus(key, row)} className="bg-white text-slate-900">{statusName(key)}</option>
                        ))}
                      </select>
                      <DeleteRecordButton table="candidate_documents" id={row.id} name={name} isDemo={row.is_demo} allowed={canDelete} onDeleted={() => { void reload(); }} />
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-300 rounded-md px-2 py-1">{t.docNotRequested}</span>
                  )}
                  {row && isApprovedWithoutFile(row) ? (
                    <span id={hintId} role="status" className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-0.5">⚠️ {t.docNoFileWarning}</span>
                  ) : row && !canPickDocumentStatus('approved', row) ? (
                    <span id={hintId} className="text-[11px] font-semibold text-slate-600">{t.docApproveNeedsFile}</span>
                  ) : null}
                </div>
              </div>

              {row ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <label className="block font-bold text-slate-700">
                    {copy.docReason}
                    <input
                      key={`${row.id}:note:${row.review_note ?? ''}`}
                      defaultValue={row.review_note || ''}
                      disabled={isBusy}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (value === (row.review_note || '')) return;
                        void run(msgKey, () => updateCandidateDocument(row, { review_note: value || null }, `${ui.docTitle} ${name}: ${value}`), t.docSaved || '');
                      }}
                      className="mt-1 w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs font-semibold bg-white text-slate-900 outline-none"
                    />
                  </label>
                  <label className="block font-bold text-slate-700">
                    {ui.docValidUntil}
                    <input
                      key={`${row.id}:valid:${row.valid_until ?? ''}`}
                      type="date"
                      defaultValue={row.valid_until || ''}
                      disabled={isBusy}
                      onBlur={(e) => {
                        const value = e.target.value;
                        if (value === (row.valid_until || '')) return;
                        void run(msgKey, () => updateCandidateDocument(row, { valid_until: value || null }, `${ui.docTitle} ${name}: ${ui.docValidUntil} ${value}`), t.docSaved || '');
                      }}
                      className="mt-1 w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs font-semibold bg-white text-slate-900 outline-none"
                    />
                  </label>
                </div>
              ) : null}

              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                {row?.file_url ? (
                  <button
                    type="button"
                    onClick={() => onPreview({ key: `${row.id}:${Date.now()}`, name, fileUrl: row.file_url!, fileName: row.notes || undefined, documentId: row.id })}
                    className="text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" /> {t.preview}
                  </button>
                ) : (
                  <span className="text-muted-foreground font-medium italic">{t.noFileUploaded}</span>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {!row ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => run(msgKey, () => requestCandidateDocument(candidateId, item.docType, rows, `${ui.docRequest} ${name}`), t.docRequestedOk || '')}
                      className="bg-white hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 font-bold cursor-pointer shadow-sm"
                    >
                      {ui.docRequest}
                    </button>
                  ) : null}
                  <label className={`bg-white hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 font-bold shadow-sm flex items-center gap-1 ${isBusy ? 'cursor-wait bg-slate-100' : 'cursor-pointer'}`}>
                    <Upload className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" /> {t.uploadFromComputer}
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" disabled={isBusy} onChange={(e) => upload(item, e)} className="sr-only" />
                  </label>
                </div>
              </div>
              {message ? (
                <p role={message.kind === 'error' ? 'alert' : 'status'} className={`text-[11px] font-bold ${message.kind === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>{message.text}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
