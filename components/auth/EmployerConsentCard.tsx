'use client';

import { useState } from 'react';
import KvkkConsent from '@/components/site/KvkkConsent';
import { KVKK_VERSION } from '@/lib/kvkk';
import { portalUi } from '@/lib/portal-ui-copy';
import { releaseCopy } from '@/lib/release-copy';
import type { Language } from '@/lib/dictionary';
import { supabase } from '@/lib/supabase';

export default function EmployerConsentCard({
  lang,
  onAccepted,
}: {
  lang: Language;
  onAccepted: () => Promise<void> | void;
}) {
  const copy = portalUi[lang].employerInvite;
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!checked) {
      setError(releaseCopy[lang].kvkkRequired);
      return;
    }
    setBusy(true);
    setError('');
    const { error: rpcError } = await supabase.rpc('record_my_employer_consent', { p_version: KVKK_VERSION });
    if (rpcError) {
      setBusy(false);
      setError(copy.consentFailed);
      return;
    }
    try {
      await onAccepted();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-lg w-full space-y-4">
      <h1 className="text-xl font-extrabold text-slate-900">{copy.consentTitle}</h1>
      <p className="text-sm leading-relaxed text-slate-800">{copy.consentLead}</p>
      <KvkkConsent id="employer-invite-kvkk" checked={checked} onChange={setChecked} copy={releaseCopy[lang]} />
      {error ? <p role="alert" className="text-sm font-bold text-red-800">{error}</p> : null}
      <button
        type="button"
        onClick={() => { void save(); }}
        disabled={busy || !checked}
        aria-busy={busy}
        className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm"
      >
        {busy ? '…' : copy.consentSave}
      </button>
    </div>
  );
}
