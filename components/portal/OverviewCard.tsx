'use client';

import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: number | string;
  /** Small line under the number (for example "total 12"). */
  sub?: string;
  icon: ReactNode;
  valueClassName?: string;
  /** Opens the card's tab. Leave out when the user cannot see that tab. */
  onOpen?: () => void;
  /** Accessible name for the button, e.g. "Personnel Requests: 3. Go to the Personnel Requests tab". */
  ariaLabel?: string;
}

/**
 * One summary card on the overview. With onOpen it is a real <button>
 * (Tab / Enter / Space, visible focus ring, light hover); without it a plain
 * block, so a tab the role cannot see is never reachable from here.
 */
export default function OverviewCard({ label, value, sub, icon, valueClassName = 'text-slate-900', onOpen, ariaLabel }: Props) {
  const body = (
    <>
      <div>
        <div className="text-muted-foreground text-[11px] sm:text-xs font-bold uppercase">{label}</div>
        <div className={`text-2xl sm:text-3xl font-extrabold mt-1 ${valueClassName}`}>{value}</div>
        {sub ? <div className="text-[11px] sm:text-xs font-semibold text-slate-600 mt-0.5">{sub}</div> : null}
      </div>
      {icon}
    </>
  );
  const base = 'bg-white p-5 sm:p-6 rounded-2xl border shadow-sm flex items-center justify-between text-start w-full';
  if (!onOpen) return <div className={base}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={ariaLabel}
      className={`${base} cursor-pointer transition hover:bg-slate-50 hover:border-slate-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-solid`}
    >
      {body}
    </button>
  );
}
