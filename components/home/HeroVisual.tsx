'use client';

import { useId } from 'react';
import { ArrowRight, Briefcase, ClipboardList, MessagesSquare, UserCheck } from 'lucide-react';

const FLOW_ICONS = [ClipboardList, UserCheck, MessagesSquare, Briefcase];

/**
 * Inline line drawing of the three countries (no image file) and the small
 * "how it works" card. The route animates only when motion is allowed
 * (.home-route in app/globals.css).
 */
export function HeroVisual({
  countries,
  mapLabel,
  flowTitle,
  flow,
}: {
  /** [Albania, North Macedonia, Türkiye] in the page language. */
  countries: [string, string, string];
  mapLabel: string;
  flowTitle: string;
  flow: readonly string[];
}) {
  const dots = `home-dots-${useId().replace(/:/g, '')}`;
  const [albania, northMacedonia, turkiye] = countries;
  return (
    <div className="grid gap-4">
      <figure dir="ltr" className="rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
        <svg viewBox="0 0 340 200" role="img" aria-label={mapLabel} className="h-auto w-full">
          <defs>
            <pattern id={dots} width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#cbd5e1" fillOpacity="0.18" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="340" height="200" rx="18" fill={`url(#${dots})`} />
          {/* country areas: schematic outlines, not to scale */}
          <path d="M44 92 C40 110 46 140 58 158 C68 150 74 128 72 108 C70 96 58 86 44 92 Z" fill="#7cb342" fillOpacity="0.16" stroke="#7cb342" strokeOpacity="0.7" strokeWidth="1.5" />
          <path d="M78 70 C96 60 128 62 142 74 C146 90 136 104 116 108 C98 110 82 102 76 90 C74 82 74 76 78 70 Z" fill="#7cb342" fillOpacity="0.16" stroke="#7cb342" strokeOpacity="0.7" strokeWidth="1.5" />
          <path d="M196 104 C214 84 262 80 296 88 C318 94 326 110 316 126 C300 144 254 150 220 144 C200 140 188 120 196 104 Z" fill="#7cb342" fillOpacity="0.16" stroke="#7cb342" strokeOpacity="0.7" strokeWidth="1.5" />
          {/* route between the three */}
          <path className="home-route" d="M58 124 Q 80 96 108 86 Q 180 40 256 116" fill="none" stroke="#7cb342" strokeWidth="2.5" strokeLinecap="round" />
          {[
            { x: 58, y: 124, label: albania, ly: 180 },
            { x: 108, y: 86, label: northMacedonia, ly: 52 },
            { x: 256, y: 116, label: turkiye, ly: 172 },
          ].map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="9" fill="#7cb342" fillOpacity="0.25" />
              <circle cx={point.x} cy={point.y} r="4.5" fill="#f8fafc" stroke="#2e7d32" strokeWidth="2" />
              <text x={point.x} y={point.ly} textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700">
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </figure>
      <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-xl">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-brand">{flowTitle}</h2>
        <ol className="mt-3 flex flex-wrap items-center gap-2">
          {flow.map((step, index) => {
            const Icon = FLOW_ICONS[index] ?? ClipboardList;
            return (
              <li key={step} className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-slate-900">
                  <Icon aria-hidden className="h-3.5 w-3.5 text-brand" /> {step}
                </span>
                {index < flow.length - 1 ? <ArrowRight aria-hidden className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" /> : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
