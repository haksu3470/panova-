'use client';

import { useState } from 'react';
import type { Translation } from '@/lib/dictionary';
import {
  CANDIDATE_STATUS_KEYS,
  candidateReasonErrorKey,
  candidateStatusLabel,
  normalizeCandidateStatus,
  type CandidateStatusErrorKey,
} from '@/lib/candidateStatusChange';
import { checkStatusReason, reasonLength, STATUS_REASON_MAX } from '@/lib/requestStatusChange';

interface Props {
  t: Translation;
  status: string | null | undefined;
  /** canUpdateRequestStatus(role): only upper management sees "Change manually". */
  canChange: boolean;
  /** Calls staff_set_candidate_status; resolves to an error key, or null on success. */
  onSubmit: (status: string, reason: string) => Promise<CandidateStatusErrorKey | null>;
  compact?: boolean;
}

/**
 * Candidate status as a read-only badge. The database derives it from the
 * official process; upper management may override it with a reason.
 */
export default function CandidateStatusControl({ t, status, canChange, onSubmit, compact = false }: Props) {
  const current = normalizeCandidateStatus(status);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<string>(current);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<CandidateStatusErrorKey | null>(null);
  const [done, setDone] = useState(false);

  const check = checkStatusReason(reason);
  const len = reasonLength(reason);
  const text = compact ? 'text-xs' : 'text-sm';

  const start = () => {
    setTarget(current);
    setReason('');
    setErrorKey(null);
    setDone(false);
    setOpen(true);
  };

  const cancel = () => {
    setOpen(false);
    setReason('');
    setErrorKey(null);
  };

  const submit = async () => {
    const localError = candidateReasonErrorKey(check);
    if (localError) {
      setErrorKey(localError);
      return;
    }
    setBusy(true);
    setErrorKey(null);
    const result = await onSubmit(target, reason.trim());
    setBusy(false);
    if (result) {
      setErrorKey(result);
      return;
    }
    setOpen(false);
    setReason('');
    setDone(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 font-bold text-slate-900 ${text}`}
          aria-label={t.colVisaStatus}
        >
          {candidateStatusLabel(t, current)}
        </span>
        {canChange && !open ? (
          <button
            type="button"
            onClick={start}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            {t.candStatusManualBtn}
          </button>
        ) : null}
      </div>

      {canChange && open ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2 min-w-[220px]">
          <select
            value={target}
            aria-label={t.statusNewLabel}
            onChange={(e) => { setTarget(e.target.value); setErrorKey(null); }}
            disabled={busy}
            className={`w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 cursor-pointer ${text}`}
          >
            {CANDIDATE_STATUS_KEYS.map((key) => (
              <option key={key} value={key}>{candidateStatusLabel(t, key)}</option>
            ))}
          </select>
          <label className="block text-[11px] font-bold text-slate-700 space-y-1">
            <span>{t.statusReasonLabel} *</span>
            <textarea
              rows={compact ? 2 : 3}
              value={reason}
              maxLength={STATUS_REASON_MAX + 50}
              onChange={(e) => { setReason(e.target.value); setErrorKey(null); }}
              disabled={busy}
              required
              aria-invalid={check !== 'ok'}
              className={`w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-900 ${text}`}
            />
          </label>
          <div className="flex items-center justify-between gap-2 text-[10px] text-slate-600">
            <span>{t.statusReasonHint}</span>
            <span className={check === 'too_long' ? 'font-bold text-red-700' : ''}>{len}/{STATUS_REASON_MAX}</span>
          </div>
          {errorKey ? <p role="alert" className="text-[11px] font-bold text-red-700">{t[errorKey]}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={busy || check !== 'ok'}
              className="flex-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white disabled:bg-slate-600 disabled:cursor-not-allowed cursor-pointer"
            >
              {busy ? (t.saving || '...') : t.saveBtn}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 cursor-pointer"
            >
              {t.statusCancelBtn}
            </button>
          </div>
        </div>
      ) : done ? (
        <p role="status" className="text-[11px] font-bold text-emerald-700">{t.candStatusChangedOk}</p>
      ) : null}
    </div>
  );
}
