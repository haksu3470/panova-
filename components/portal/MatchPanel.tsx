'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, UserPlus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import DemoBadge from './DemoBadge';

const RESULTS: { value: string; label: string }[] = [
  { value: '', label: '— Sonuç yok —' },
  { value: 'interview', label: '🤝 Görüşmeye çağrıldı' },
  { value: 'selected', label: '⭐ Seçildi' },
  { value: 'backup', label: '🔁 Yedek' },
  { value: 'later', label: '⏳ Daha sonra' },
  { value: 'not_suitable', label: '❌ Uygun değil' },
];

interface Props {
  request: any;
  onClose: () => void;
}

/** Talep–aday eşleştirme: request_matches tablosuna bağlar, sunar, işveren sonucunu kaydeder. */
export default function MatchPanel({ request, onClose }: Props) {
  const [matches, setMatches] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
    const { error } = await fn();
    if (error) setError(error.message);
    else await writeAudit(audit, 'job_request', request.id, { candidate_id: entityId });
    await load();
    setBusy(false);
  };

  const bind = (cid: string) =>
    run(
      async () => supabase.from('request_matches').insert({ request_id: request.id, candidate_id: cid, bound_at: new Date().toISOString(), is_demo: !!request.is_demo }),
      `Aday talebe bağlandı: ${byId[cid]?.full_name}`,
      cid
    );

  const present = (m: any) =>
    run(
      async () => supabase.from('request_matches').update({ presented_at: new Date().toISOString() }).eq('id', m.id),
      `Aday işverene sunuldu: ${byId[m.candidate_id]?.full_name}`,
      m.candidate_id
    );

  const setResult = (m: any, value: string) =>
    run(
      async () => supabase.from('request_matches').update({ employer_result: value || null }).eq('id', m.id),
      `İşveren sonucu: ${value || 'temizlendi'} (${byId[m.candidate_id]?.full_name})`,
      m.candidate_id
    );

  const remove = (m: any) => {
    if (!confirm('Bu eşleşme kaldırılsın mı?')) return;
    run(async () => supabase.from('request_matches').delete().eq('id', m.id), `Eşleşme kaldırıldı: ${byId[m.candidate_id]?.full_name}`, m.candidate_id);
  };

  const selectedCount = matches.filter((m) => m.employer_result === 'selected').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">🔗 Aday Eşleştirme</h3>
            <p className="text-xs text-slate-500">
              {request.position_title} · {request.employer_name} · Seçilen {selectedCount}/{request.headcount}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Kapat"><X className="w-5 h-5" /></button>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-600">Bağlı adaylar ({matches.length})</h4>
          {matches.length === 0 && <p className="text-xs text-slate-400">Henüz aday bağlanmadı.</p>}
          {matches.map((m) => {
            const c = byId[m.candidate_id];
            return (
              <div key={m.id} className="border rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">{c?.full_name || m.candidate_id}<DemoBadge show={m.is_demo} /></p>
                  <p className="text-[11px] text-slate-500">
                    {c?.profession} · {c?.nationality} · {m.presented_at ? `Sunuldu ${m.presented_at.substring(0, 10)}` : 'Sunulmadı'}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  {!m.presented_at && (
                    <button disabled={busy} onClick={() => present(m)} className="text-xs font-bold px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">Sun</button>
                  )}
                  <select disabled={busy} value={m.employer_result || ''} onChange={(e) => setResult(m, e.target.value)} className="text-xs border rounded-lg px-2 py-2 bg-slate-50">
                    {RESULTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <button disabled={busy} onClick={() => remove(m)} className="p-2 rounded-lg text-red-600 hover:bg-red-50" aria-label="Kaldır"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-600">Önerilen adaylar</h4>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İsim, meslek veya uyruk ara…" className="w-full border rounded-xl px-3 py-2 text-sm" />
          {suggestions.map((c) => (
            <div key={c.id} className="border rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">{c.full_name}<DemoBadge show={c.is_demo} /></p>
                <p className="text-[11px] text-slate-500">{c.profession} · {c.sector} · {c.experience_years ?? 0} yıl · uyum {c.score}/5</p>
              </div>
              <button disabled={busy} onClick={() => bind(c.id)} className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-600 text-white flex items-center gap-1 disabled:opacity-50">
                <UserPlus className="w-4 h-4" /> Bağla
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
