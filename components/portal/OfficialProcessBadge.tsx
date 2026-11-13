// Read-only label of job_candidates.official_process_status: "<step> · n/8",
// a red badge when the process was stopped, or the stored value when it is
// not one of the 8 steps (lib/employerPlacements.ts OFFICIAL_STEPS).

import { officialProcessText, officialProcessView } from '@/lib/employerPlacements';

type Props = {
  status: string | null | undefined;
  steps: Record<string, string>;
  stoppedLabel: string;
};

export default function OfficialProcessBadge({ status, steps, stoppedLabel }: Props) {
  const view = officialProcessView(status);
  const label = officialProcessText(status, steps, stoppedLabel);
  const tone = view.kind === 'stopped'
    ? 'bg-red-100 text-red-800 border-red-200'
    : view.kind === 'step' && view.step === 'started_work'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : view.kind === 'step' && view.step === 'not_started'
        ? 'bg-slate-100 text-slate-800 border-slate-200'
        : 'bg-indigo-50 text-indigo-900 border-indigo-200';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md border text-xs font-bold whitespace-nowrap ${tone}`}>
      {view.kind === 'stopped' ? `⛔ ${label}` : label}
    </span>
  );
}
