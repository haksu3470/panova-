'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import type { Language } from '@/lib/dictionary';
import { METRIC_KEYS, formatMetric, groupMetricRows, processMetricsLabels, type GroupedMetricRow, type MetricGroupBy, type ProcessMetricRow } from '@/lib/processMetrics';
import { candidatePlaceLabel } from '@/lib/candidateLabels';
import OverviewCard from './OverviewCard';

const DEMO_KEY = 'panova.processMetrics.includeDemo';

/**
 * Staff overview: the five numbers from public.staff_process_metrics.
 * app_settings.process_metrics_enabled switches it off (old screens); only
 * upper management (canManage) sees the switch, and while off only they see
 * this section at all.
 */
export default function ProcessMetricsPanel({ lang, canManage }: { lang: Language; canManage: boolean }) {
  const l = processMetricsLabels[lang];
  // Remembered per browser: the panel remounts each time the overview tab opens.
  const [includeDemo, setIncludeDemoState] = useState(() => {
    try { return typeof window !== 'undefined' && window.localStorage.getItem(DEMO_KEY) === '1'; } catch { return false; }
  });
  const setIncludeDemo = (on: boolean) => {
    setIncludeDemoState(on);
    try { window.localStorage.setItem(DEMO_KEY, on ? '1' : '0'); } catch { /* storage blocked: keep in memory only */ }
  };
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [rows, setRows] = useState<ProcessMetricRow[]>([]);
  const [groupBy, setGroupBy] = useState<MetricGroupBy>('all');
  const [groupRows, setGroupRows] = useState<GroupedMetricRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    // Missing function (toggle rolled back) or an error reads as on, the default.
    supabase.rpc('process_metrics_enabled').then(({ data }) => { if (live) setEnabled(data !== false); });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    const request = groupBy === 'all'
      ? supabase.rpc('staff_process_metrics', { p_include_demo: includeDemo })
      : supabase.rpc('staff_process_metrics_by', { p_by: groupBy, p_include_demo: includeDemo });
    request.then(({ data, error: rpcError }) => {
      if (!live) return;
      setError(rpcError ? rpcError.message : '');
      if (groupBy === 'all') setRows((data as ProcessMetricRow[]) || []);
      else setGroupRows((data as GroupedMetricRow[]) || []);
    });
    return () => { live = false; };
  }, [includeDemo, enabled, groupBy]);

  const groupName = (key: string, label: string) => {
    if (!key) return l.unknown;
    return groupBy === 'country' ? candidatePlaceLabel(label, '', lang, l.unknown) : label || l.unknown;
  };

  const setFeature = async (next: boolean) => {
    if (busy || enabled === next) return;
    setBusy(true); setNotice('');
    const { data, error: updateError } = await supabase
      .from('app_settings')
      .update({ value: next, updated_at: new Date().toISOString() })
      .eq('key', 'process_metrics_enabled')
      .select('key');
    setBusy(false);
    if (updateError || !data?.length) return setNotice(l.toggleFailed);
    setEnabled(next);
    setNotice(l.toggleSaved);
    void writeAudit(next ? 'process_metrics_on' : 'process_metrics_off', 'app_settings', 'process_metrics_enabled');
  };

  if (enabled === null || (!enabled && !canManage)) return null;

  const toggleBtn = (value: boolean, label: string) => (
    <button
      type="button"
      disabled={busy}
      aria-pressed={enabled === value}
      onClick={() => setFeature(value)}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${enabled === value ? 'bg-slate-900 text-white shadow' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'}`}
    >
      {label}
    </button>
  );

  return (
    <section className="space-y-3" aria-labelledby="process-metrics-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="process-metrics-title" className="font-bold text-slate-900">{l.title}</h2>
        <div className="flex flex-wrap items-center gap-3">
          {enabled && (
            <div className="flex gap-1.5" role="group" aria-label={l.title}>
              {([['all', l.byAll], ['country', l.byCountry], ['employer', l.byEmployer]] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={groupBy === value}
                  onClick={() => setGroupBy(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${groupBy === value ? 'bg-indigo-700 text-white shadow' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {enabled && (
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-indigo-600 rounded" checked={includeDemo} onChange={(e) => setIncludeDemo(e.target.checked)} />
              {l.includeDemo}
            </label>
          )}
          {canManage && (
            <div className="flex gap-1.5" role="group" aria-label={l.title} title={l.toggleHint}>
              {toggleBtn(true, l.toggleOn)}
              {toggleBtn(false, l.toggleOff)}
            </div>
          )}
        </div>
      </div>
      {notice ? <p role="status" className="text-xs font-bold text-emerald-700">{notice}</p> : null}
      {!enabled ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-700">{l.offNote}</p>
          <p className="text-[11px] text-slate-600 font-medium">{l.toggleHint}</p>
        </div>
      ) : (
        <>
          {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}
          {groupBy !== 'all' ? (
            groupMetricRows(groupRows).length === 0 ? (
              <p className="text-sm font-semibold text-slate-700">{l.noGroups}</p>
            ) : (
              <div className="overflow-x-auto bg-white rounded-2xl border shadow-sm">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th scope="col" className="text-start font-bold px-3 py-2">{groupBy === 'country' ? l.groupCountry : l.groupEmployer}</th>
                      {METRIC_KEYS.map((key) => <th key={key} scope="col" className="text-start font-bold px-3 py-2">{l.metrics[key]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {groupMetricRows(groupRows).map((g) => (
                      <tr key={g.key} className="border-t">
                        <th scope="row" className="text-start font-bold text-slate-900 px-3 py-2">{groupName(g.key, g.label)}</th>
                        {METRIC_KEYS.map((key) => (
                          <td key={key} className="px-3 py-2 text-slate-900">
                            <span className="font-bold">{formatMetric(g.metrics[key], lang)}</span>
                            <span className="block text-[11px] text-slate-600">{l.sample.replace('{n}', String(g.metrics[key]?.sample ?? 0))}</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
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
          )}
          <p className="text-[11px] text-slate-600 font-medium">{l.hint}</p>
          {canManage && <p className="text-[11px] text-muted-foreground font-medium">{l.toggleHint}</p>}
        </>
      )}
    </section>
  );
}
