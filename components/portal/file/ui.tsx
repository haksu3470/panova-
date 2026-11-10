import type { ReactNode } from 'react';
import type { Translation } from '@/lib/dictionary';
import type { PortalUi } from '@/lib/portal-ui-copy';

export const REQUEST_STATUS_KEYS = [
  'new_request',
  'reviewing',
  'searching_candidates',
  'presenting_candidates',
  'interviews',
  'selection_completed',
  'official_process',
  'travel_planning',
  'completed',
  'cancelled',
] as const;

export function requestStatusLabel(t: Translation, status?: string | null) {
  const map: Record<string, string | undefined> = {
    new_request: t.stageNewRequest,
    reviewing: t.stageReviewing,
    searching_candidates: t.stageSearchingCandidates,
    presenting_candidates: t.stagePresentingCandidates,
    interviews: t.stageInterviews,
    selection_completed: t.stageSelectionCompleted,
    official_process: t.stageOfficialProcess,
    travel_planning: t.stageTravelPlanning,
    completed: t.stageCompleted,
    cancelled: t.stageCancelled,
  };
  return (status && map[status]) || status || '—';
}

export function resultLabel(ui: PortalUi, result?: string | null) {
  return (result && ui.matchResults[result]) || '';
}

export function Card({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="bg-card rounded-2xl border border-line shadow-sm p-4 sm:p-6 space-y-3 text-foreground">
      <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
        <h2 className="text-sm sm:text-base font-extrabold text-foreground">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-line p-3 sm:p-4 shadow-sm">
      <div className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground">{label}</div>
      <div className="text-xl sm:text-2xl font-extrabold text-foreground mt-1">{value}</div>
    </div>
  );
}

export function Field({ label, value, onChange, type = 'text', textarea }: { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  const cls = 'w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand';
  return (
    <label className="block text-xs font-bold text-muted-foreground space-y-1">
      <span>{label}</span>
      {textarea ? (
        <textarea className={cls} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cls} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export const fmtDate = (s?: string | null) => (s ? String(s).substring(0, 10) : '—');
