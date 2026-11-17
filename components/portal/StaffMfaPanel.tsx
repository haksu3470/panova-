'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ReleaseCopy } from '@/lib/release-copy';

type Factor = { id: string; status: string };

export default function StaffMfaPanel({
  copy,
  blocking,
  required,
  hasVerifiedFactor,
  onVerified,
}: {
  copy: ReleaseCopy;
  blocking: boolean;
  required: boolean;
  hasVerifiedFactor: boolean;
  onVerified: () => void;
}) {
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [enabled, setEnabled] = useState(hasVerifiedFactor && !blocking);

  const lead = blocking
    ? hasVerifiedFactor
      ? copy.mfaChallenge
      : copy.mfaSetupRequired
    : enabled
      ? copy.mfaOn
      : copy.mfaOptional;

  const verify = async (id: string) => {
    setBusy(true);
    setError('');
    const challenge = await supabase.auth.mfa.challenge({ factorId: id });
    if (challenge.error || !challenge.data) {
      setBusy(false);
      setError(copy.mfaFailed);
      return;
    }
    const checked = await supabase.auth.mfa.verify({
      factorId: id,
      challengeId: challenge.data.id,
      code: code.trim(),
    });
    setBusy(false);
    if (checked.error) {
      setError(copy.mfaFailed);
      return;
    }
    setCode('');
    setQr('');
    setSecret('');
    setFactorId('');
    setEnabled(true);
    onVerified();
  };

  const enroll = async () => {
    setBusy(true);
    setError('');
    const enrolled = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Panova staff',
    });
    setBusy(false);
    if (enrolled.error || !enrolled.data?.totp) {
      setError(copy.mfaFailed);
      return;
    }
    setFactorId(enrolled.data.id);
    setQr(enrolled.data.totp.qr_code);
    setSecret(enrolled.data.totp.secret);
  };

  const disable = async (factors: Factor[]) => {
    if (required) return;
    setBusy(true);
    setError('');
    for (const factor of factors) {
      const result = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (result.error) {
        setBusy(false);
        setError(copy.mfaFailed);
        return;
      }
    }
    setBusy(false);
    setEnabled(false);
    onVerified();
  };

  const challengeExisting = async () => {
    setBusy(true);
    setError('');
    const listed = await supabase.auth.mfa.listFactors();
    const factor = listed.data?.totp?.find((item) => item.status === 'verified');
    setBusy(false);
    if (!factor) {
      setError(copy.mfaFailed);
      return;
    }
    await verify(factor.id);
  };

  const showEnroll = blocking ? !hasVerifiedFactor : !enabled;
  const showCode = Boolean(factorId) || (blocking && hasVerifiedFactor);

  return (
    <section className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-3">
      <h3 className="text-base font-extrabold text-slate-900">{copy.mfaTitle}</h3>
      <p className="text-xs text-slate-600 leading-snug">{lead}</p>
      {qr ? (
        <div className="space-y-2">
          {qr.startsWith('data:') || qr.startsWith('<svg') ? (
            qr.startsWith('<svg') ? (
              <div className="h-40 w-40 bg-white [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="" className="h-40 w-40 bg-white" />
            )
          ) : null}
          <p className="text-[11px] font-mono break-all text-slate-700">
            {copy.mfaSecret}: {secret}
          </p>
        </div>
      ) : null}
      {showCode ? (
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder={copy.mfaCode}
          className="w-full max-w-xs px-3 py-2 rounded-xl border text-sm text-slate-900 bg-white"
        />
      ) : null}
      {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {showEnroll && !factorId ? (
          <button
            type="button"
            disabled={busy}
            onClick={enroll}
            className="px-3 py-2 rounded-xl bg-brand-solid text-on-dark text-xs font-bold disabled:bg-disabled disabled:text-on-dark disabled:opacity-100"
          >
            {copy.mfaEnroll}
          </button>
        ) : null}
        {factorId ? (
          <button
            type="button"
            disabled={busy || code.trim().length < 6}
            onClick={() => verify(factorId)}
            className="px-3 py-2 rounded-xl bg-brand-solid text-on-dark text-xs font-bold disabled:bg-disabled disabled:text-on-dark disabled:opacity-100"
          >
            {copy.mfaConfirm}
          </button>
        ) : null}
        {blocking && hasVerifiedFactor ? (
          <button
            type="button"
            disabled={busy || code.trim().length < 6}
            onClick={challengeExisting}
            className="px-3 py-2 rounded-xl bg-brand-solid text-on-dark text-xs font-bold disabled:bg-disabled disabled:text-on-dark disabled:opacity-100"
          >
            {copy.mfaConfirm}
          </button>
        ) : null}
        {!blocking && enabled && !required ? (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              const listed = await supabase.auth.mfa.listFactors();
              await disable(listed.data?.totp ?? []);
            }}
            className="px-3 py-2 rounded-xl border text-xs font-bold text-slate-700"
          >
            {copy.mfaDisable}
          </button>
        ) : null}
      </div>
    </section>
  );
}
