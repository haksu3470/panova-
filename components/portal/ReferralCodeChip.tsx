'use client';

import { useState } from 'react';
import { copyText } from '@/lib/copyText';

export function ReferralCodeChip({
  code,
  label,
  copyLabel,
  copiedLabel,
}: {
  code: string;
  label?: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const ok = await copyText(code);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 px-2 py-1 rounded-lg text-[11px] font-bold">
      {label ? <span>{label}</span> : null}
      <span className="font-mono tracking-wide">{code}</span>
      <button
        type="button"
        onClick={copy}
        className="underline underline-offset-2 cursor-pointer font-bold"
        aria-label={`${copyLabel} ${code}`}
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </span>
  );
}
