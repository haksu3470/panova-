'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Language } from '@/lib/dictionary';
import { METRIC_KEYS, formatMetric, processMetricsLabels, type ProcessMetricRow } from '@/lib/processMetrics';
import OverviewCard from './OverviewCard';

const DEMO_KEY = 'panova.processMetrics.includeDemo';

/** Staff overview: the five numbers from public.staff_process_metrics. */
export default function ProcessMetricsPanel({ lang }: { lang: Language }) {
  const l = processMetricsLabels[lang];
  // Remembered per browser: the panel remounts each time the overview tab opens.
  const [includeDemo, setIncludeDemoState] = useState(() => {
    try { return typeof window !== 'undefined' && window.localStorage.getItem(DEMO_KEY) === '1'; } catch { return false; }
  });
  const setIncludeDemo = (on: boolean) => {
    setIncludeDemoState(on);
    try { window.localStorage.setItem(DEMO_KEY, on ? '1' : '0'); } catch { /* storage blocked: keep in memory only */ }
  };
  const [rows, setRows] = useState<ProcessMetricRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    supabase.rpc('staff_process_metrics', { p_include_demo: includeDemo }).then(({ data, error: rpcError }) => {
      if (!live) return;
      setError(rpcError ? rpcError.message : '');
      setRows((data as ProcessMetricRow[]) || []);
    });
    return () => { live = false; };
  }, [includeDemo]);

  return (
    <section className="space-y-3" aria-labelledby="process-metrics-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="process-metrics-title" className="font-bold text-slate-900">{l.title}</h2>
        <label className="text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-indigo-600 rounded" checked={includeDemo} onChange={(e) => setIncludeDemo(e.target.checked)} />
          {l.includeDemo}
        </label>
      </div>
      {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {METRIC_KEYS.map((key) => {
          const row = rows.find((r) => r.metric === key);
          return (
            <OverviewCard
              key={key}
              label={l.metrics[key]}
              value={formatMetric(row, lang)}
              sub={l.sample.replace('{n}', String(row?.sample ?? 0))}
              valueClassName="text-indigo-700"
              icon={<Activity className="w-9 h-9 sm:w-10 sm:h-10 text-indigo-600 bg-indigo-50 p-2 rounded-xl shrink-0" aria-hidden="true" />}
            />
          );
        })}
      </div>
      <p className="text-[11px] text-slate-600 font-medium">{l.hint}</p>
    </section>
  );
}
