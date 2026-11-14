'use client';

import { useId } from 'react';
import { ArrowRight, Briefcase, ClipboardList, MessagesSquare, UserCheck } from 'lucide-react';

const FLOW_ICONS = [ClipboardList, UserCheck, MessagesSquare, Briefcase];

/**
 * Where each office city sits on the schematic drawing (viewBox 340 x 200),
 * west to east: North Macedonia, Türkiye, Bangladesh. Keys are the cities in
 * company.presence (lib/company.ts); lib/home-page.test.ts keeps them in step.
 * Not to scale: the drawing only shows the three countries and the link
 * between them.
 */
export const HERO_MAP_POINTS: Readonly<Record<string, { x: number; y: number; labelY: number; area: string }>> = {
  Struga: {
    x: 52, y: 92, labelY: 136,
    area: 'M30 80 C34 66 60 62 72 72 C80 82 76 100 64 108 C50 114 34 108 30 96 C28 90 28 86 30 80 Z',
  },
  Sivas: {
    x: 160, y: 104, labelY: 62,
    area: 'M104 96 C112 80 160 74 200 80 C222 84 230 98 222 112 C212 126 170 132 136 128 C112 124 98 110 104 96 Z',
  },
  Dhaka: {
    x: 292, y: 118, labelY: 168,
    area: 'M272 96 C284 86 306 88 314 100 C320 112 316 132 304 142 C292 148 278 140 274 128 C268 118 266 104 272 96 Z',
  },
};

export type HeroPlace = { city: string; country: string };

/**
 * Inline line drawing of the office countries (no image file) and the small
 * "how it works" card. Labels are country names only; the dashed route stands
 * for the Struga / Sivas / Dhaka link. The route animates only when motion is
 * allowed (.home-route in app/globals.css).
 */
export function HeroVisual({
  places,
  mapLabel,
  flowTitle,
  flow,
}: {
  /** company.presence with country names in the page language. */
  places: readonly HeroPlace[];
  mapLabel: string;
  flowTitle: string;
  flow: readonly string[];
}) {
  const dots = `home-dots-${useId().replace(/:/g, '')}`;
  const points = places
    .flatMap((place) => {
      const point = HERO_MAP_POINTS[place.city];
      return point ? [{ ...point, label: place.country, city: place.city }] : [];
    })
    .sort((a, b) => a.x - b.x);
  const route = points.length > 1
    ? points.map((point, index) => {
      if (index === 0) return `M${point.x} ${point.y}`;
      const previous = points[index - 1];
      const midX = (previous.x + point.x) / 2;
      const liftY = Math.min(previous.y, point.y) - 34;
      return `Q ${midX} ${liftY} ${point.x} ${point.y}`;
    }).join(' ')
    : '';

  return (
    <div className="grid gap-4">
      {/* The drawing keeps west-to-east order in Arabic too. */}
      <figure dir="ltr" className="rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
        <svg viewBox="0 0 340 200" role="img" aria-label={mapLabel} className="h-auto w-full">
          <defs>
            <pattern id={dots} width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#cbd5e1" fillOpacity="0.18" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="340" height="200" rx="18" fill={`url(#${dots})`} />
          {points.map((point) => (
            <path key={`area-${point.city}`} d={point.area} fill="#7cb342" fillOpacity="0.16" stroke="#7cb342" strokeOpacity="0.7" strokeWidth="1.5" />
          ))}
          {route ? (
            <path className="home-route" d={route} fill="none" stroke="#7cb342" strokeWidth="2.5" strokeLinecap="round" />
          ) : null}
          {points.map((point) => (
            <g key={point.city}>
              <circle cx={point.x} cy={point.y} r="9" fill="#7cb342" fillOpacity="0.25" />
              <circle cx={point.x} cy={point.y} r="4.5" fill="#f8fafc" stroke="#2e7d32" strokeWidth="2" />
              <text
                x={Math.min(Math.max(point.x, 64), 276)}
                y={point.labelY}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="11"
                fontWeight="700"
              >
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
