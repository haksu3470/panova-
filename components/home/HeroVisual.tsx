'use client';

import { useId } from 'react';
import { Briefcase, ClipboardList, MessagesSquare, UserCheck } from 'lucide-react';
import { HERO_MAP_POINTS, LABEL_FONT_SIZE, MAP_HEIGHT, MAP_TOP, MAP_WIDTH, labelX, routePath } from '@/lib/hero-map';

const FLOW_ICONS = [ClipboardList, UserCheck, MessagesSquare, Briefcase];

export type HeroPlace = { city: string; country: string };

/**
 * Inline line drawing of the office countries (no image file) and the small
 * "how it works" card. Labels are country names only; the dashed route stands
 * for the Struga / Sivas / Dhaka link. The route animates only when motion is
 * allowed (.home-route in app/globals.css). Geometry: lib/hero-map.ts.
 *
 * How it works: numbered steps with a one-sentence description, joined by a
 * dashed line like the map route. Four columns from sm (the line runs through
 * the circle centres and follows the page direction); on phones a vertical
 * list with a vertical line. The line is static, so reduced motion needs nothing.
 */
export function HeroVisual({
  places,
  mapLabel,
  flowTitle,
  flow,
  flowDesc,
}: {
  /** company.presence with country names in the page language. */
  places: readonly HeroPlace[];
  mapLabel: string;
  flowTitle: string;
  flow: readonly string[];
  /** One sentence per step, same order as flow. */
  flowDesc: readonly string[];
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
        <svg viewBox={`0 ${MAP_TOP} ${MAP_WIDTH} ${MAP_HEIGHT}`} role="img" aria-label={mapLabel} className="h-auto w-full">
          <defs>
            <pattern id={dots} width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#cbd5e1" fillOpacity="0.18" />
            </pattern>
          </defs>
          <rect x="0" y={MAP_TOP} width={MAP_WIDTH} height={MAP_HEIGHT} rx="18" fill={`url(#${dots})`} />
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
                className="sm:[font-size:12px]"
              >
                {point.label}
              </text>
            </g>
          ))}
        </svg>
      </figure>
      <div className="rounded-3xl border border-emerald-100 border-t-4 border-t-brand-solid bg-emerald-50 p-4 text-slate-900 shadow-xl">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-brand">{flowTitle}</h2>
        <ol className="mt-3 grid grid-cols-1 gap-y-2 sm:grid-cols-4 sm:gap-x-2 sm:gap-y-0">
          {flow.map((step, index) => {
            const Icon = FLOW_ICONS[index] ?? ClipboardList;
            const last = index === flow.length - 1;
            return (
              <li key={step} className="relative flex min-w-0 gap-3 sm:flex-col sm:items-center sm:gap-1.5 sm:text-center">
                <span aria-hidden className="relative z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-solid text-sm font-extrabold text-white shadow-sm">
                  {index + 1}
                </span>
                {last ? null : (
                  <>
                    {/* phones: vertical dashed line from this circle down to the next one */}
                    <span aria-hidden data-connector="vertical" className="pointer-events-none absolute start-[calc(1rem-1px)] top-9 -bottom-1 border-s-2 border-dashed border-brand-solid/50 sm:hidden" />
                    {/* sm+: horizontal dashed line through the circle centres, to the next circle */}
                    <span aria-hidden data-connector="horizontal" className="pointer-events-none absolute top-[calc(1rem-1px)] start-[calc(50%+1.25rem)] end-[calc(-50%+0.75rem)] hidden border-t-2 border-dashed border-brand-solid/50 sm:block" />
                  </>
                )}
                <div className="min-w-0 pb-1 sm:pb-0">
                  <p className="flex items-center gap-1.5 text-sm font-extrabold leading-snug text-slate-900 sm:justify-center">
                    <Icon aria-hidden className="h-4 w-4 shrink-0 text-brand" />
                    <span className="[overflow-wrap:anywhere]">{step}</span>
                  </p>
                  {flowDesc[index] ? (
                    <p className="mt-0.5 text-xs leading-snug text-slate-700 [overflow-wrap:anywhere]">{flowDesc[index]}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
