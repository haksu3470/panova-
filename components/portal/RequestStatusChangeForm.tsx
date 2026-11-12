'use client';

import { useState } from 'react';
import type { Translation } from '@/lib/dictionary';
import { normalizeDemandStatus } from '@/lib/demandStatus';
import { REQUEST_STATUS_KEYS, requestStatusLabel } from '@/components/portal/file/ui';
import {
  checkStatusReason, reasonCheckErrorKey, reasonLength, STATUS_REASON_MAX, type StatusErrorKey,
} from '@/lib/requestStatusChange';

interface Props {
  t: Translation;
  currentStatus: string | null | undefined;
  /** Calls staff_set_request_status; resolves to an error key, or null on success. */
  onSubmit: (status: string, reason: string) => Promise<StatusErrorKey | null>;
  compact?: boolean;
}

/**
 * Status select for upper management. Picking another status opens a small
 * inline reason form; nothing is sent until the reason is valid and the
 * button is pressed. Only render this for canUpdateRequestStatus(role).
 */
export default function RequestStatusChangeForm({ t, currentStatus, onSubmit, compact = false }: Props) {
  const current = normalizeDemandStatus(currentStatus) || 'new_request';
  const [target, setTarget] = useState<string>(current);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<StatusErrorKey | null>(null);
  const [done, setDone] = useState(false);
  // The stored status changed (saved here or reloaded): follow it.
  const [shown, setShown] = useState(current);
  if (shown !== current) {
    setShown(current);
    setTarget(current);
    setReason('');
  }

  const open = target !== current;
  const check = checkStatusReason(reason);
  const len = reasonLength(reason);

  const reset = () => {
    setTarget(current);
    setReason('');
    setErrorKey(null);
  };

  const submit = async () => {
    const localError = reasonCheckErrorKey(check);
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
    setReason('');
    setDone(true);
  };

  const text = compact ? 'text-xs' : 'text-sm';

  return (
    <div className="space-y-2">
      <select
        value={target}
        aria-label={t.statusNewLabel}
        onChange={(e) => { setTarget(e.target.value); setErrorKey(null); setDone(false); }}
        disabled={busy}
        className={`w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 cursor-pointer ${text}`}
      >
        {REQUEST_STATUS_KEYS.map((key) => (
          <option key={key} value={key}>{requestStatusLabel(t, key)}</option>
        ))}
      </select>

      {open ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
          <label className="block text-[11px] font-bold text-slate-700 space-y-1">
            <span>{t.statusReasonLabel} *</span>
            <textarea
              rows={compact ? 2 : 3}
              value={reason}
              maxLength={STATUS_REASON_MAX + 50}
              onChange={(e) => { setReason(e.target.value); setErrorKey(null); }}
              disabled={busy}
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
              {busy ? (t.saving || '...') : t.statusApplyBtn}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 cursor-pointer"
            >
              {t.statusCancelBtn}
            </button>
          </div>
        </div>
      ) : done ? (
        <p role="status" className="text-[11px] font-bold text-emerald-700">{t.statusChangedOk}</p>
      ) : null}
    </div>
  );
}
