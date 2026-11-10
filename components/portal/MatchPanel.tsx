'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, UserPlus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import DemoBadge from './DemoBadge';
import InterviewOfferPanel from './InterviewOfferPanel';
import { fill, portalUi } from '@/lib/portal-ui-copy';
import { useSiteLanguage } from '@/lib/site-language';

interface Props {
  request: any;
  onClose: () => void;
}

/** Link candidates to a request, present them, and record the employer result. */
export default function MatchPanel({ request, onClose }: Props) {
  const { currentLang } = useSiteLanguage('en');
  const ui = portalUi[currentLang];
  const [matches, setMatches] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ioMatch, setIoMatch] = useState<any | null>(null);

  const load = async () => {
    const [m, c] = await Promise.all([
      supabase.from('request_matches').select('*').eq('request_id', request.id).order('created_at'),
      supabase
        .from('job_candidates')
        .select('id, full_name, profession, sector, nationality, experience_years, status, is_demo, archived_at')
        .is('archived_at', null)
        .order('full_name'),
    ]);
    if (m.error) setError(m.error.message);
    setMatches(m.data || []);
    setCandidates(c.data || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.id]);

  const byId = useMemo(() => Object.fromEntries(candidates.map((c) => [c.id, c])), [candidates]);
  const matchedIds = new Set(matches.map((m) => m.candidate_id));

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates
      .filter((c) => !matchedIds.has(c.id))
      .filter((c) => !q || `${c.full_name} ${c.profession} ${c.nationality}`.toLowerCase().includes(q))
      .map((c) => {
        let score = 0;
        if (request.sector && c.sector?.toLowerCase() === String(request.sector).toLowerCase()) score += 2;
        if (request.position_title && c.profession?.toLowerCase().includes(String(request.position_title).toLowerCase().split(' ')[0])) score += 2;
        if ((c.experience_years ?? 0) >= (request.required_experience_years ?? 0)) score += 1;
        return { ...c, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, matches, search, request]);

  const run = async (fn: () => Promise<{ error: any }>, audit: string, entityId?: string) => {
    setBusy(true);
    setError('');
    const { error: runError } = await fn();
    if (runError) setError(runError.message);
    else await writeAudit(audit, 'job_request', request.id, { candidate_id: entityId });
    await load();
    setBusy(false);
  };

  const bind = (cid: string) =>
    run(
      async () => supabase.from('request_matches').insert({ request_id: request.id, candidate_id: cid, bound_at: new Date().toISOString(), is_demo: !!request.is_demo }),
      `${ui.bind}: ${byId[cid]?.full_name}`,
      cid
    );

  const present = (m: any) =>
    run(
      async () => supabase.from('request_matches').update({ presented_at: new Date().toISOString() }).eq('id', m.id),
      `${ui.present}: ${byId[m.candidate_id]?.full_name}`,
      m.candidate_id
    );

  const setResult = (m: any, value: string) =>
    run(
      async () => supabase.from('request_matches').update({ employer_result: value || null }).eq('id', m.id),
      `${ui.matchTitle}: ${value || '—'} (${byId[m.candidate_id]?.full_name})`,
      m.candidate_id
    );

  const remove = (m: any) => {
    if (!confirm(ui.confirmRemove)) return;
    run(async () => supabase.from('request_matches').delete().eq('id', m.id), `${ui.remove}: ${byId[m.candidate_id]?.full_name}`, m.candidate_id);
  };

  const selectedCount = matches.filter((m) => m.employer_result === 'selected').length;

  return (
    <>
    {ioMatch && (
      <InterviewOfferPanel
        candidate={{ id: ioMatch.candidate_id, ...(byId[ioMatch.candidate_id] || {}) }}
        request={request}
        match={ioMatch}
        onClose={() => { setIoMatch(null); load(); }}
      />
    )}
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white text-slate-900 scheme-light w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">🔗 {ui.matchTitle}</h3>
            <p className="text-xs text-muted-foreground">
              {request.position_title} · {request.employer_name} · {fill(ui.selectedOf, { selected: selectedCount, total: request.headcount })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-700 hover:bg-slate-100" aria-label={ui.close}><X className="w-5 h-5" /></button>
        </div>

        {error && <p className="text-xs text-red-800 bg-red-50 p-2 rounded-lg">{error}</p>}

        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">{ui.linkedCandidates} ({matches.length})</h4>
          {matches.length === 0 && <p className="text-xs text-muted-foreground">{ui.noneLinked}</p>}
          {matches.map((m) => {
            const c = byId[m.candidate_id];
            return (
              <div key={m.id} className="border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">{c?.full_name || m.candidate_id}<DemoBadge show={m.is_demo} /></p>
                  <p className="text-[11px] text-muted-foreground">
                    {c?.profession} · {c?.nationality} · {m.presented_at ? fill(ui.presentedOn, { date: String(m.presented_at).substring(0, 10) }) : ui.notPresented}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  {!m.presented_at && (
                    <button disabled={busy} onClick={() => present(m)} className="text-xs font-bold px-3 py-2 rounded-lg bg-blue-600 text-white disabled:bg-disabled disabled:text-on-dark disabled:opacity-100">{ui.present}</button>
                  )}
                  <select disabled={busy} value={m.employer_result || ''} onChange={(e) => setResult(m, e.target.value)} className="text-xs font-semibold border border-slate-300 rounded-lg px-2 py-2 bg-white text-slate-900 scheme-light">
                    <option className="bg-white text-slate-900" value="">— {ui.intNoResult} —</option>
                    {Object.entries(ui.matchResults).map(([value, label]) => <option key={value} className="bg-white text-slate-900" value={value}>{label}</option>)}
                  </select>
                  {m.presented_at && (m.employer_result === 'interview' || m.employer_result === 'selected') && (
                    <button disabled={busy} onClick={() => setIoMatch(m)} className="text-xs font-bold px-3 py-2 rounded-lg bg-amber-800 text-on-dark whitespace-nowrap">
                      {m.employer_result === 'selected' ? `📄 ${ui.offer}` : `📅 ${ui.interview}`}
                    </button>
                  )}
                  <button disabled={busy} onClick={() => remove(m)} className="p-2 rounded-lg text-red-800 hover:bg-red-50" aria-label={ui.remove}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">{ui.suggested}</h4>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ui.searchCandidates} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-600 outline-none scheme-light" />
          {suggestions.map((c) => (
            <div key={c.id} className="border rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">{c.full_name}<DemoBadge show={c.is_demo} /></p>
                <p className="text-[11px] text-muted-foreground">{c.profession} · {c.sector} · {fill(ui.yearsFit, { years: c.experience_years ?? 0, score: c.score })}</p>
              </div>
              <button disabled={busy} onClick={() => bind(c.id)} className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-700 text-white flex items-center gap-1 disabled:bg-disabled disabled:text-on-dark disabled:opacity-100">
                <UserPlus className="w-4 h-4" /> {ui.bind}
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
    </>
  );
}
