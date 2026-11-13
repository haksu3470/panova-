'use client';

// "Süreciniz" on the candidate home page: the official process stage
// (8 steps, lib/employerPlacements.ts OFFICIAL_STEPS), the flight details
// and the start date of an accepted offer. The candidate's own
// job_candidates row and own job_offers are already loaded by the page.
// PNR and accommodation are not shown here on purpose.

import type { Language, Translation } from '@/lib/dictionary';
import { dateLocale, fill } from '@/lib/portal-ui-copy';
import {
  acceptedOfferStartDate,
  dayOf,
  hasFlightInfo,
  OFFICIAL_STEPS,
  officialProcessView,
  toTravelFields,
  travelView,
} from '@/lib/employerPlacements';

type Props = {
  candidate: Record<string, unknown> | null;
  offers: readonly Record<string, unknown>[];
  loading: boolean;
  t: Translation;
  steps: Record<string, string>;
  lang: Language;
  isRtl: boolean;
};

const PROCESS_COLUMNS = ['official_process_status', 'travel_status', 'flight_date', 'flight_number', 'departure_city', 'arrival_city'];

/** False when the row came back without the process columns (not readable). */
export function hasProcessColumns(row: Record<string, unknown> | null): boolean {
  return Boolean(row) && PROCESS_COLUMNS.every((key) => key in (row as Record<string, unknown>));
}

function formatDay(value: string | null, lang: Language): string | null {
  if (!value) return null;
  const day = dayOf(value);
  if (!day) return value;
  const [y, m, d] = day.split('-').map(Number);
  try {
    return new Intl.DateTimeFormat(dateLocale[lang], { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(y, m - 1, d));
  } catch {
    return day;
  }
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 text-xs">
      <span className="font-bold text-slate-700">{k}</span>
      <span className="font-semibold text-slate-900 break-words">{v}</span>
    </div>
  );
}

export default function CandidateProcessCard({ candidate, offers, loading, t, steps, lang, isRtl }: Props) {
  const box = 'bg-white p-6 rounded-3xl border shadow-sm space-y-5';
  const sub = 'bg-slate-50 p-4 rounded-2xl border space-y-3';
  const title = <h3 className="text-lg font-extrabold text-slate-900 border-b pb-3">🧭 {t.yourProcessTitle}</h3>;

  if (loading) {
    return (
      <section className={box} aria-busy="true">
        {title}
        <p className="text-sm font-semibold text-slate-700" role="status">{t.plLoading}</p>
      </section>
    );
  }
  if (!hasProcessColumns(candidate)) {
    return (
      <section className={box}>
        {title}
        <p className="text-sm font-semibold text-slate-700">{t.processInfoUnavailable}</p>
      </section>
    );
  }

  const row = candidate as Record<string, unknown>;
  const status = typeof row.official_process_status === 'string' ? row.official_process_status : null;
  const view = officialProcessView(status);
  const travel = toTravelFields(row);
  const trip = travelView(travel);
  const startDate = formatDay(acceptedOfferStartDate(offers), lang);
  const arrow = isRtl ? ' ← ' : ' → ';
  const notEntered = t.plNotEntered || '';

  let stage: React.ReactNode;
  if (view.kind === 'stopped') {
    stage = <p className="text-sm font-bold text-red-700">{t.plProcessStopped}</p>;
  } else if (view.kind === 'unknown' || (view.kind === 'step' && view.step === 'not_started')) {
    stage = <p className="text-sm font-semibold text-slate-700">{t.processNotStartedYet}</p>;
  } else {
    const current = view.number - 1;
    stage = (
      <div className="space-y-2">
        <ol className="grid grid-cols-8 gap-1" aria-label={steps[view.step] || view.step}>
          {OFFICIAL_STEPS.map((step, i) => (
            <li key={step} title={steps[step] || step} className={`h-2 rounded-full ${i <= current ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          ))}
        </ol>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-900">{steps[view.step] || view.step}</span>
          <span className="text-slate-700 font-semibold">{fill(t.plStepOf || '', { n: view.number, total: view.total })}</span>
        </div>
      </div>
    );
  }

  const route = travel.departure_city || travel.arrival_city
    ? `${travel.departure_city || notEntered}${arrow}${travel.arrival_city || notEntered}`
    : notEntered;
  const tripStatus = trip.kind === 'flight' && trip.status === 'ticketed'
    ? t.plTravelTicketed
    : trip.kind === 'flight' && trip.status === 'completed'
      ? t.plTravelCompleted
      : null;

  return (
    <section className={box}>
      {title}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={sub}>
          <p className="text-xs font-extrabold text-slate-900">{t.processStageLabel}</p>
          {stage}
        </div>
        <div className={sub}>
          <p className="text-xs font-extrabold text-slate-900">✈️ {t.travelInfoLabel}</p>
          {trip.kind === 'not_entered' || !hasFlightInfo(travel) ? (
            <p className="text-sm font-semibold text-slate-700">{tripStatus || t.plTravelNotEntered}</p>
          ) : (
            <div className="space-y-1.5">
              {tripStatus && <p className="text-xs font-bold text-emerald-800">{tripStatus}</p>}
              <Row k={t.plFlightDate || ''} v={travel.flight_date || notEntered} />
              <Row k={t.plFlightNumber || ''} v={travel.flight_number || notEntered} />
              <Row k={t.plRoute || ''} v={route} />
            </div>
          )}
        </div>
        <div className={sub}>
          <p className="text-xs font-extrabold text-slate-900">📅 {t.plStartDate}</p>
          <p className="text-sm font-semibold text-slate-900">{startDate || t.startDateNotSet}</p>
        </div>
      </div>
    </section>
  );
}
