'use client';

import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Language } from '@/lib/dictionary';
import { demoLoginLabels, type DemoLoginKind } from '@/lib/demoLogin';

/**
 * Upper management: one-time sign-in link for a demo candidate / demo
 * employer / test staff account (/api/demo-login). The link is shown to be
 * copied into a private window; opening it here would replace the staff session.
 */
export default function DemoLoginButton({ kind, id, lang, className = '' }: { kind: DemoLoginKind; id: string; lang: Language; className?: string }) {
  const l = demoLoginLabels[lang] || demoLoginLabels.en;
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const prepare = async () => {
    setBusy(true); setError(''); setLink(''); setCopied(false);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const res = token
      ? await fetch('/api/demo-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ kind, id }),
        }).catch(() => null)
      : null;
    const body = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok || !body.link) {
      setError(`${l.failed}${body.error ? ` (${body.error})` : ''}`);
      return;
    }
    setLink(body.link);
    setName(body.name || '');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        type="button"
        onClick={prepare}
        disabled={busy}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 disabled:bg-disabled disabled:text-on-dark disabled:opacity-100"
      >
        <LogIn className="w-3.5 h-3.5" aria-hidden /> {busy ? l.making : l.button}
      </button>
      {error ? <p role="alert" className="text-xs font-bold text-red-700">{error}</p> : null}
      {link ? (
        <div role="status" className="p-3 rounded-xl border border-amber-300 bg-amber-50 space-y-2 text-xs text-amber-950">
          <p className="font-bold">{l.ready.replace('{name}', name)}</p>
          <p>{l.warning}</p>
          <div className="flex flex-wrap items-center gap-2">
            <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label={l.copy} className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-amber-300 bg-white text-[11px] text-slate-900" />
            <button type="button" onClick={copy} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold">
              {copied ? l.copied : l.copy}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
