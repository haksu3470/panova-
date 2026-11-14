'use client';

import { useId } from 'react';
import { ArrowRight, Briefcase, ClipboardList, MessagesSquare, UserCheck } from 'lucide-react';
import { HERO_MAP_POINTS, LABEL_FONT_SIZE, MAP_HEIGHT, MAP_WIDTH, labelX, routePath } from '@/lib/hero-map';

const FLOW_ICONS = [ClipboardList, UserCheck, MessagesSquare, Briefcase];

export type HeroPlace = { city: string; country: string };

/**
 * Inline line drawing of the office countries (no image file) and the small
 * "how it works" card. Labels are country names only; the dashed route stands
 * for the Struga / Sivas / Dhaka link. The route animates only when motion is
 * allowed (.home-route in app/globals.css). Geometry: lib/hero-map.ts.
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
  const route = points.length > 1 ? routePath(points) : '';

  return (
    <div className="grid gap-4">
      {/* The drawing keeps west-to-east order in Arabic too. */}
      <figure dir="ltr" className="rounded-3xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label={mapLabel} className="h-auto w-full">
          <defs>
            <pattern id={dots} width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#cbd5e1" fillOpacity="0.18" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} rx="18" fill={`url(#${dots})`} />
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
                x={labelX(point.x, point.label)}
                y={point.labelY}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize={LABEL_FONT_SIZE}
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
        {/* Four equal columns from sm (2x2 on phones); grid order follows the page direction. */}
        <ol className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
          {flow.map((step, index) => {
            const Icon = FLOW_ICONS[index] ?? ClipboardList;
            return (
              <li key={step} className="relative flex min-w-0 flex-col items-center gap-1.5 text-center">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-emerald-200 bg-emerald-50">
                  <Icon aria-hidden className="h-4 w-4 text-brand" />
                </span>
                <span className="text-xs font-bold leading-snug text-slate-900 [overflow-wrap:anywhere]">{step}</span>
                {index < flow.length - 1 ? (
                  // zero-width box centred in the column gap, level with the icons
                  <span aria-hidden className="pointer-events-none absolute top-[1.125rem] hidden -translate-y-1/2 -end-2 w-0 sm:flex justify-center">
                    <ArrowRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground rtl:rotate-180" />
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
