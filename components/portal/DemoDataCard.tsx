'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Database, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Translation } from '@/lib/dictionary';
import {
  CANDIDATE_FILES_BUCKET,
  DEMO_SUMMARY_ROWS,
  demoCounts,
  demoDeletableTotal,
  demoErrorText,
  demoSeedOutcome,
  demoTotal,
  isDemoRoleError,
  removeCandidateFolders,
  type DemoCounts,
  type DemoFileBucket,
} from '@/lib/demoData';

interface Props {
  t: Translation;
  /** Reloads the portal lists after seed / delete. */
  onChanged?: () => void | Promise<void>;
}

type Notice = { tone: 'ok' | 'error'; text: string } | null;
type Busy = 'load' | 'seed' | 'delete' | null;

const fill = (text: string | undefined, values: Record<string, string | number>) =>
  Object.entries(values).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), text || '');

/** Upper management only: the parent renders it only for that role. */
export default function DemoDataCard({ t, onChanged }: Props) {
  const [counts, setCounts] = useState<DemoCounts | null>(null);
  const [busy, setBusy] = useState<Busy>('load');
  const [notice, setNotice] = useState<Notice>(null);
  const running = useRef(false);

  const errorNotice = useCallback(
    (error: unknown): Notice => ({
      tone: 'error',
      text: isDemoRoleError(error) ? t.demoDataRoleError || '' : fill(t.demoDataFailed, { error: demoErrorText(error) }),
    }),
    [t],
  );

  const loadSummary = useCallback(async (): Promise<Notice> => {
    const { data, error } = await supabase.rpc('staff_demo_data_summary');
    if (error) return errorNotice(error);
    setCounts(demoCounts(data));
    return null;
  }, [errorNotice]);

  useEffect(() => {
    let cancelled = false;
    supabase.rpc('staff_demo_data_summary').then(({ data, error }) => {
      if (cancelled) return;
      if (error) setNotice(errorNotice(error));
      else setCounts(demoCounts(data));
      setBusy(null);
    });
    return () => {
      cancelled = true;
    };
  }, [errorNotice]);

  // One action at a time: the ref blocks a double click before React re-renders.
  const run = async (kind: Exclude<Busy, null | 'load'>, action: () => Promise<Notice>) => {
    if (running.current) return;
    running.current = true;
    setBusy(kind);
    setNotice(null);
    let result: Notice;
    try {
      result = await action();
    } catch (error) {
      result = errorNotice(error);
    }
    const reload = await loadSummary().catch(errorNotice);
    setNotice(result ?? reload);
    try {
      await onChanged?.();
    } catch {
      // the lists reload on their own next time; the result is already shown
    }
    running.current = false;
    setBusy(null);
  };

  const seed = () => {
    if (!window.confirm(t.demoDataSeedConfirm || '')) return;
    void run('seed', async () => {
      const { data, error } = await supabase.rpc('staff_seed_demo_data');
      if (error) return errorNotice(error);
      const outcome = demoSeedOutcome(data);
      return outcome.kind === 'created'
        ? { tone: 'ok', text: fill(t.demoDataSeedDone, { n: outcome.total }) }
        : { tone: 'ok', text: t.demoDataAlreadyExists || '' };
    });
  };

  const deletable = counts ? demoDeletableTotal(counts) : 0;

  const removeAll = () => {
    if (!window.confirm(fill(t.demoDataDeleteConfirm, { n: deletable }))) return;
    void run('delete', async () => {
      // 1. Files of the candidates that will be deleted (linked accounts stay).
      const { data: rows, error: listError } = await supabase
        .from('job_candidates')
        .select('id')
        .eq('is_demo', true)
        .is('auth_user_id', null);
      if (listError) return errorNotice(listError);
      const ids = (rows ?? []).map((row: { id: string }) => row.id).filter(Boolean);
      try {
        await removeCandidateFolders(supabase.storage.from(CANDIDATE_FILES_BUCKET) as unknown as DemoFileBucket, ids);
      } catch (fileError) {
        // Stop here: no RPC, nothing in the database is deleted.
        return { tone: 'error', text: fill(t.demoDataFilesFailed, { error: demoErrorText(fileError) }) };
      }
      // 2. The rows (backed up by the RPC first).
      const { data, error } = await supabase.rpc('staff_delete_demo_data');
      if (error) return errorNotice(error);
      return { tone: 'ok', text: fill(t.demoDataDeleteDone, { n: demoTotal(demoCounts(data)) }) };
    });
  };

  const disabled = busy !== null;

  return (
    <section className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4" aria-labelledby="demo-data-title" aria-busy={disabled}>
      <div className="flex items-start gap-3">
        <Database className="w-6 h-6 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <h3 id="demo-data-title" className="text-base sm:text-lg font-extrabold text-slate-900">{t.demoDataTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-600">{t.demoDataDesc}</p>
        </div>
      </div>

      {counts === null ? (
        busy === 'load' ? (
          <p className="text-xs text-slate-600 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t.demoDataLoading}
          </p>
        ) : null
      ) : (
        <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {DEMO_SUMMARY_ROWS.map(({ table, label }) => (
            <div key={table} className="rounded-xl border bg-slate-50 px-3 py-2">
              <dt className="text-[11px] font-bold uppercase text-slate-600">{t[label]}</dt>
              <dd className="text-xl font-extrabold text-slate-900">{counts[table] ?? 0}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={seed}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:bg-slate-500 disabled:cursor-not-allowed"
        >
          {busy === 'seed' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
          {t.demoDataSeed}
        </button>
        <button
          type="button"
          onClick={removeAll}
          disabled={disabled || counts === null || deletable === 0}
          title={counts !== null && deletable === 0 ? t.demoDataNothing : undefined}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:bg-slate-500 disabled:cursor-not-allowed"
        >
          {busy === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Trash2 className="w-4 h-4" aria-hidden="true" />}
          {t.demoDataDelete}
        </button>
      </div>

      {busy === 'seed' || busy === 'delete' ? (
        <p className="text-xs text-slate-600" role="status">{t.demoDataWorking}</p>
      ) : null}
      {counts !== null && deletable === 0 && !notice ? (
        <p className="text-xs text-slate-600">{t.demoDataNothing}</p>
      ) : null}
      {notice ? (
        <p
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`whitespace-pre-line rounded-xl border px-3 py-2 text-sm font-semibold ${
            notice.tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {notice.text}
        </p>
      ) : null}
    </section>
  );
}
