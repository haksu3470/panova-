'use client';

// The three employer tabs fed by public.employer_placements(): İşlem Durumu,
// Seyahat Bilgilerim, Aktif Çalışanlar. Only the fields that RPC returns are
// shown; nothing else is loaded here.

import { Plane } from 'lucide-react';
import type { Translation } from '@/lib/dictionary';
import { fill } from '@/lib/portal-ui-copy';
import {
  dayOf,
  followupState,
  groupByRequest,
  isoDay,
  isProcessStopped,
  OFFICIAL_STEPS,
  officialStepIndex,
  startedEmployees,
  travelView,
  type EmployerPlacement,
  type FollowupState,
  type PipelineStage,
} from '@/lib/employerPlacements';

export type PlacementsLoad = 'loading' | 'ready' | 'error';
export type PlacementTab = 'status' | 'travel' | 'employees';

type Props = {
  tab: PlacementTab;
  rows: EmployerPlacement[];
  load: PlacementsLoad;
  staffView: boolean;
  t: Translation;
  steps: Record<string, string>;
  isRtl: boolean;
};

const card = 'bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4';
const heading = 'text-base sm:text-lg font-extrabold text-slate-950 border-b pb-3';
const note = 'p-4 rounded-xl border bg-slate-50 text-sm font-semibold text-slate-700';

function stageBadge(stage: PipelineStage | null, t: Translation) {
  const label =
    stage === 'in_process' ? t.plStageInProcess
      : stage === 'travel_ready' ? t.plStageTravelReady
        : stage === 'started' ? t.plStageStarted
          : t.plStageNone;
  const tone =
    stage === 'started' ? 'bg-emerald-100 text-emerald-800'
      : stage === 'travel_ready' ? 'bg-blue-100 text-blue-800'
        : stage === 'in_process' ? 'bg-amber-100 text-amber-800'
          : 'bg-slate-100 text-slate-800';
  return <span className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-bold ${tone}`}>{label}</span>;
}

function personLine(row: EmployerPlacement) {
  return [row.profession, row.nationality].filter(Boolean).join(' · ');
}

function ProgressBar({ row, t, steps }: { row: EmployerPlacement; t: Translation; steps: Record<string, string> }) {
  if (isProcessStopped(row.official_process_status)) {
    return <p className="text-xs font-bold text-red-700">{t.plProcessStopped}</p>;
  }
  const idx = officialStepIndex(row.official_process_status);
  const current = idx < 0 ? 0 : idx;
  return (
    <div className="space-y-1.5">
      <ol className="grid grid-cols-8 gap-1" aria-label={steps[OFFICIAL_STEPS[current]] || ''}>
        {OFFICIAL_STEPS.map((step, i) => (
          <li
            key={step}
            title={steps[step] || step}
            className={`h-2 rounded-full ${i <= current ? 'bg-indigo-600' : 'bg-slate-200'}`}
          />
        ))}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-bold text-slate-900">{steps[OFFICIAL_STEPS[current]] || OFFICIAL_STEPS[current]}</span>
        <span className="text-muted-foreground font-semibold">
          {fill(t.plStepOf || '', { n: current + 1, total: OFFICIAL_STEPS.length })}
        </span>
      </div>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
      <div className="text-xs font-bold uppercase text-muted-foreground">{k}</div>
      <div className="text-sm font-semibold text-slate-900 break-words">{v}</div>
    </div>
  );
}

function followupLabel(state: FollowupState, t: Translation) {
  return state === 'completed' ? t.plFuCompleted : state === 'overdue' ? t.plFuOverdue : t.plFuPlanned;
}

function followupTone(state: FollowupState) {
  return state === 'completed'
    ? 'bg-emerald-100 text-emerald-800'
    : state === 'overdue'
      ? 'bg-red-100 text-red-800'
      : 'bg-blue-100 text-blue-800';
}

export default function EmployerPlacementTabs({ tab, rows, load, staffView, t, steps, isRtl }: Props) {
  const title = tab === 'status' ? t.processStatusTitle : tab === 'travel' ? t.travelStartTitle : t.activeEmployeesTitle;
  const shown = tab === 'employees' ? startedEmployees(rows) : rows;
  const empty = tab === 'status' ? t.plNoSelected : tab === 'travel' ? t.plNoTravel : t.plNoEmployees;
  const arrow = isRtl ? ' ← ' : ' → ';
  const today = isoDay(new Date());
  const notEntered = t.plNotEntered || '';

  let body: React.ReactNode;
  if (load === 'loading') {
    body = <p className={note} role="status">{t.plLoading}</p>;
  } else if (load === 'error') {
    body = <p className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm font-bold text-red-800" role="alert">{t.plLoadError}</p>;
  } else if (shown.length === 0) {
    body = <p className={note}>{staffView ? t.plStaffNote : empty}</p>;
  } else {
    body = (
      <div className="space-y-5">
        {groupByRequest(shown).map((group) => (
          <section key={group.request_id} className="space-y-2.5">
            <h4 className="text-sm font-extrabold text-slate-900">{group.title || '—'}</h4>
            <ul className={tab === 'employees' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-3'}>
              {group.rows.map((row) => {
                const travel = travelView(row);
                return (
                  <li key={row.match_id} className="p-4 bg-slate-50 rounded-xl border space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-950 break-words">{row.full_name || '—'}</div>
                        {personLine(row) && <div className="text-xs text-muted-foreground font-semibold">{personLine(row)}</div>}
                      </div>
                      {tab === 'status' && stageBadge(row.pipeline_stage, t)}
                      {tab === 'travel' && travel.kind === 'flight' && travel.status && (
                        <span className="shrink-0 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                          {travel.status === 'completed' ? t.plTravelCompleted : t.plTravelTicketed}
                        </span>
                      )}
                    </div>

                    {tab === 'status' && <ProgressBar row={row} t={t} steps={steps} />}

                    {tab === 'travel' && (
                      <div className="space-y-2">
                        {travel.kind === 'not_entered' ? (
                          <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                            <Plane className="w-4 h-4 text-blue-600" /> {t.plTravelNotEntered}
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <Field k={t.plFlightDate || ''} v={row.flight_date || '—'} />
                            <Field k={t.plFlightNumber || ''} v={row.flight_number || '—'} />
                            <Field k={t.plRoute || ''} v={[row.departure_city || '—', row.arrival_city || '—'].join(arrow)} />
                          </div>
                        )}
                        <Field k={t.plStartDate || ''} v={dayOf(row.start_date) || row.start_date || notEntered} />
                      </div>
                    )}

                    {tab === 'employees' && (
                      <div className="space-y-3">
                        <Field k={t.plStartDate || ''} v={dayOf(row.start_date) || row.start_date || notEntered} />
                        <div className="space-y-1.5">
                          <div className="text-xs font-bold uppercase text-muted-foreground">{t.plFollowupTitle}</div>
                          {row.followups.length === 0 ? (
                            <p className="text-sm font-semibold text-slate-700">{t.plFollowupNone}</p>
                          ) : (
                            <ul className="space-y-1.5">
                              {row.followups.map((fu, i) => {
                                const state = followupState(fu, today);
                                return (
                                  <li key={`${fu.period_stage}-${i}`} className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-sm">
                                    <span className="font-bold text-slate-900">{fill(t.plPeriod || '', { n: fu.period_stage })}</span>
                                    <span className="text-slate-700 font-semibold">
                                      {t.plCheckDate}: {dayOf(fu.check_date) || fu.check_date || notEntered}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${followupTone(state)}`}>
                                      {followupLabel(state, t)}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className={card}>
      <h3 className={heading}>{title}</h3>
      {body}
    </div>
  );
}
