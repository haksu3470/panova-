'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import DemoBadge from './DemoBadge';

/** §11 #8 resmî süreç adımları (job_candidates.official_process_status) */
export const OFFICIAL_STEPS = [
  { value: 'not_started', label: 'Başlamadı' },
  { value: 'documents_collecting', label: 'Evrak toplanıyor' },
  { value: 'work_permit_applied', label: 'Çalışma izni başvurusu' },
  { value: 'work_permit_approved', label: 'Çalışma izni onaylandı' },
  { value: 'visa_applied', label: 'Vize başvurusu' },
  { value: 'visa_approved', label: 'Vize onaylandı' },
  { value: 'ready_to_travel', label: 'Seyahate hazır' },
  { value: 'started_work', label: 'İşe başladı' },
];
const REJECTED = { value: 'rejected', label: 'Reddedildi / durdu' };
const TRAVEL: Record<string, string> = { planned: '✈️ Planlanıyor', ticketed: '🎟️ Biletlendi', completed: '✅ Tamamlandı' };
const STAGES = ['30', '60', '90'];

interface Props {
  candidateId: string;
}

export default function PlacementPanel({ candidateId }: Props) {
  const [c, setC] = useState<any>(null);
  const [offer, setOffer] = useState<any>(null);
  const [fus, setFus] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const emptyFu = { id: null, period_stage: '30', check_date: '', compliance_score: '', salary_compliance: true, accommodation_compliance: true, employer_feedback: '', employee_feedback: '', notes: '' };
  const [fu, setFu] = useState<any>(emptyFu);

  const load = async () => {
    const [a, o, f] = await Promise.all([
      supabase.from('job_candidates').select('id, full_name, is_demo, official_process_status, travel_status, flight_date, flight_number, departure_city, arrival_city, pnr_code, accommodation_details, active_employer_id, active_request_id').eq('id', candidateId).maybeSingle(),
      supabase.from('job_offers').select('*').eq('candidate_id', candidateId).order('created_at', { ascending: false }),
      supabase.from('placement_followups').select('*').eq('candidate_id', candidateId).order('period_stage'),
    ]);
    const err = a.error || o.error || f.error;
    if (err) setError(err.message);
    setC(a.data);
    const offers = o.data || [];
    setOffer(offers.find((x: any) => x.status === 'accepted') || offers[0] || null);
    setFus(f.data || []);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  if (!c) return null;
  const cur = c.official_process_status || 'not_started';
  const curIdx = OFFICIAL_STEPS.findIndex((s) => s.value === cur);

  const setOfficial = async (value: string) => {
    setBusy(true); setError(''); setMsg('');
    const patch: any = { official_process_status: value, updated_at: new Date().toISOString() };
    if (value === 'started_work') patch.travel_status = 'completed';
    const { error } = await supabase.from('job_candidates').update(patch).eq('id', candidateId);
    if (error) setError(error.message);
    else {
      await writeAudit(`Resmî süreç: ${c.full_name} → ${[...OFFICIAL_STEPS, REJECTED].find((s) => s.value === value)?.label}`, 'candidate', candidateId, { official_process_status: value });
      setMsg('Resmî süreç güncellendi.');
    }
    await load(); setBusy(false);
  };

  const startedWork = cur === 'started_work';
  const employerName = offer?.employer_name || '';

  const saveFu = async () => {
    if (!employerName && !fu.id) return setError('Takip için önce kabul edilmiş bir iş teklifi (firma) olmalı.');
    setBusy(true); setError(''); setMsg('');
    const row: any = {
      period_stage: fu.period_stage,
      check_date: fu.check_date || null,
      compliance_score: fu.compliance_score ? Number(fu.compliance_score) : null,
      salary_compliance: !!fu.salary_compliance,
      accommodation_compliance: !!fu.accommodation_compliance,
      employer_feedback: fu.employer_feedback || null,
      employee_feedback: fu.employee_feedback || null,
      notes: fu.notes || null,
      updated_at: new Date().toISOString(),
    };
    const res = fu.id
      ? await supabase.from('placement_followups').update(row).eq('id', fu.id)
      : await supabase.from('placement_followups').insert({
          ...row,
          candidate_id: candidateId,
          employer_name: employerName,
          employer_id: c.active_employer_id ?? null,
          request_id: offer?.request_id ?? c.active_request_id ?? null,
          is_demo: !!c.is_demo,
        });
    if (res.error) setError(res.error.message);
    else {
      await writeAudit(`${fu.period_stage}. gün takibi ${fu.id ? 'güncellendi' : 'kaydedildi'}: ${c.full_name}`, 'placement_followup', candidateId, { stage: fu.period_stage });
      setFu(emptyFu); setMsg('Takip kaydedildi.');
    }
    await load(); setBusy(false);
  };

  const box = 'bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-3';
  const inp = 'w-full px-3 py-2.5 rounded-xl border bg-white text-sm text-slate-800 outline-none';

  return (
    <div className="space-y-4">
      {(error || msg) && <p className={`text-xs font-bold ${error ? 'text-red-600' : 'text-emerald-700'}`}>{error || msg}</p>}

      {/* #8 Resmî süreç */}
      <div className={box}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-slate-900">🏛️ Resmî Süreç Durumu</h3>
          {c.is_demo && <DemoBadge />}
        </div>
        <ol className="space-y-1.5">
          {OFFICIAL_STEPS.map((s, i) => {
            const done = cur !== 'rejected' && i <= curIdx;
            return (
              <li key={s.value}>
                <button disabled={busy} onClick={() => setOfficial(s.value)}
                  className={`w-full text-left text-xs sm:text-sm px-3 py-2 rounded-lg border flex items-center gap-2 ${s.value === cur ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : done ? 'bg-indigo-50 text-indigo-800 border-indigo-200' : 'bg-white text-slate-600'}`}>
                  <span>{done ? '✔' : i + 1 + '.'}</span> {s.label}
                </button>
              </li>
            );
          })}
        </ol>
        <button disabled={busy} onClick={() => setOfficial('rejected')}
          className={`text-xs font-bold px-3 py-2 rounded-lg border ${cur === 'rejected' ? 'bg-red-600 text-white' : 'text-red-700 border-red-200'}`}>
          ⛔ {REJECTED.label}
        </button>
      </div>

      {/* #9 Seyahat + işe başlangıç özeti */}
      <div className={box}>
        <h3 className="font-bold text-slate-900">🧳 Seyahat & İşe Başlangıç</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <Info k="Seyahat" v={TRAVEL[c.travel_status] || c.travel_status || '—'} />
          <Info k="Uçuş" v={[c.flight_date, c.flight_number].filter(Boolean).join(' · ') || '—'} />
          <Info k="Güzergâh" v={[c.departure_city, c.arrival_city].filter(Boolean).join(' → ') || '—'} />
          <Info k="PNR" v={c.pnr_code || '—'} />
          <Info k="Konaklama" v={c.accommodation_details || '—'} />
          <Info k="İşveren / başlangıç" v={offer ? `${offer.employer_name}${offer.start_date ? ' · ' + offer.start_date : ''} (${offer.status})` : 'Teklif yok'} />
        </div>
        <p className="text-[11px] text-slate-500">Uçuş bilgilerini aşağıdaki “Seyahat, Uçuş ve Konaklama” bölümünden düzenleyip kaydedin.</p>
        {startedWork ? (
          <p className="text-sm font-bold text-emerald-700">✅ Aday işe başladı — 30/60/90 takibi aktif.</p>
        ) : (
          <button disabled={busy} onClick={() => setOfficial('started_work')} className="w-full sm:w-auto text-xs font-bold px-4 py-2.5 rounded-lg bg-emerald-600 text-white">
            İşe başladı olarak işaretle
          </button>
        )}
      </div>

      {/* #10 30/60/90 takip */}
      <div className={box}>
        <h3 className="font-bold text-slate-900">📆 30 / 60 / 90 Gün Takibi</h3>
        <div className="grid grid-cols-3 gap-2">
          {STAGES.map((st) => {
            const r = fus.find((x) => String(x.period_stage) === st);
            return (
              <button key={st} onClick={() => setFu(r ? { ...emptyFu, ...r, compliance_score: r.compliance_score ?? '', check_date: r.check_date ?? '' } : { ...emptyFu, period_stage: st })}
                className={`p-2 rounded-xl border text-center text-xs ${r ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50'} ${fu.period_stage === st ? 'ring-2 ring-indigo-400' : ''}`}>
                <div className="font-extrabold text-base">{st}. gün</div>
                <div>{r ? `${r.compliance_score ? '★'.repeat(r.compliance_score) : 'Kaydedildi'}` : 'Bekliyor'}</div>
                {r?.is_demo && <div className="mt-1"><DemoBadge /></div>}
              </button>
            );
          })}
        </div>
        {!startedWork && fus.length === 0 && <p className="text-[11px] text-amber-700">Not: Aday henüz “işe başladı” olarak işaretlenmedi.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="text-xs">Kontrol tarihi<input type="date" className={inp} value={fu.check_date} onChange={(e) => setFu({ ...fu, check_date: e.target.value })} /></label>
          <label className="text-xs">Uyum puanı (1–5)
            <select className={inp} value={fu.compliance_score} onChange={(e) => setFu({ ...fu, compliance_score: e.target.value })}>
              <option value="">—</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={fu.salary_compliance} onChange={(e) => setFu({ ...fu, salary_compliance: e.target.checked })} /> Maaş sözleşmeye uygun</label>
          <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={fu.accommodation_compliance} onChange={(e) => setFu({ ...fu, accommodation_compliance: e.target.checked })} /> Konaklama uygun</label>
          <textarea className={inp} rows={2} placeholder="İşveren geri bildirimi" value={fu.employer_feedback || ''} onChange={(e) => setFu({ ...fu, employer_feedback: e.target.value })} />
          <textarea className={inp} rows={2} placeholder="Çalışan geri bildirimi" value={fu.employee_feedback || ''} onChange={(e) => setFu({ ...fu, employee_feedback: e.target.value })} />
          <textarea className={`${inp} sm:col-span-2`} rows={2} placeholder="Panova notu" value={fu.notes || ''} onChange={(e) => setFu({ ...fu, notes: e.target.value })} />
        </div>
        <button disabled={busy} onClick={saveFu} className="w-full sm:w-auto text-xs font-bold px-4 py-2.5 rounded-lg bg-indigo-600 text-white">
          {fu.id ? `${fu.period_stage}. gün takibini güncelle` : `${fu.period_stage}. gün takibini kaydet`}
        </button>
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="p-2 rounded-lg bg-slate-50 border">
      <div className="text-[10px] font-bold uppercase text-slate-500">{k}</div>
      <div className="font-semibold text-slate-800 break-words">{v}</div>
    </div>
  );
}
