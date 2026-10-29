'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import DemoBadge from './DemoBadge';
import { Language, translations } from '@/lib/dictionary';
import { readStoredLanguage } from '@/lib/site-language';

export const OFFICIAL_STEPS = [
  { value: 'not_started', labelTr: 'Başlamadı', labelMk: 'Не е започнато' },
  { value: 'documents_collecting', labelTr: 'Evrak toplanıyor', labelMk: 'Се собираат документи' },
  { value: 'work_permit_applied', labelTr: 'Çalışma izni başvurusu', labelMk: 'Апликација за работна дозвола' },
  { value: 'work_permit_approved', labelTr: 'Çalışma izni onaylandı', labelMk: 'Одобрена работна дозвола' },
  { value: 'visa_applied', labelTr: 'Vize başvurusu', labelMk: 'Апликација за виза' },
  { value: 'visa_approved', labelTr: 'Vize onaylandı', labelMk: 'Одобрена виза' },
  { value: 'ready_to_travel', labelTr: 'Seyahate hazır', labelMk: 'Подготвени за патување' },
  { value: 'started_work', labelTr: 'İşe başladı', labelMk: 'Започнато со работа' },
];

const REJECTED = { value: 'rejected', labelTr: 'Reddedildi / durdu', labelMk: 'Одбиено / прекинато' };
const STAGES = ['30', '60', '90'];

interface Props {
  candidateId: string;
}

export default function PlacementPanel({ candidateId }: Props) {
  const [currentLang, setCurrentLang] = useState<Language>('en');

  useEffect(() => {
    const apply = () => {
      const next = readStoredLanguage('en');
      setCurrentLang(next);
    };
    apply();
    window.addEventListener('storage', apply);
    return () => window.removeEventListener('storage', apply);
  }, []);

  const t = translations[currentLang] || translations.en;
  const isMk = currentLang === 'mk';

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
      const stepObj = [...OFFICIAL_STEPS, REJECTED].find((s) => s.value === value);
      const stepLabel = isMk ? (stepObj?.labelMk || stepObj?.labelTr) : (stepObj?.labelTr || stepObj?.labelMk);
      await writeAudit(`Resmî süreç: ${c.full_name} → ${stepLabel}`, 'candidate', candidateId, { official_process_status: value });
      setMsg(isMk ? 'Официјалниот процес е ажуриран.' : 'Resmî süreç güncellendi.');
    }
    await load(); setBusy(false);
  };

  const startedWork = cur === 'started_work';
  const employerName = offer?.employer_name || '';

  const saveFu = async () => {
    if (!employerName && !fu.id) return setError(isMk ? 'За следење прво мора да има прифатена понуда за работа (компанија).' : 'Takip için önce kabul edilmiş bir iş teklifi (firma) olmalı.');
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
      setFu(emptyFu); setMsg(isMk ? 'Следењето е зачувано.' : 'Takip kaydedildi.');
    }
    await load(); setBusy(false);
  };

  const box = 'bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3';
  const inp = 'w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 outline-none font-medium';

  return (
    <div className="space-y-4">
      {(error || msg) && <p className={`text-xs font-bold ${error ? 'text-red-600' : 'text-emerald-700'}`}>{error || msg}</p>}

      {/* #8 Resmî süreç */}
      <div className={box}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-slate-900">🏛️ {isMk ? 'Официјален статус на процес' : 'Resmî Süreç Durumu'}</h3>
          {c.is_demo && <DemoBadge />}
        </div>
        <ol className="space-y-1.5">
          {OFFICIAL_STEPS.map((s, i) => {
            const done = cur !== 'rejected' && i <= curIdx;
            const label = isMk ? s.labelMk : s.labelTr;
            return (
              <li key={s.value}>
                <button disabled={busy} onClick={() => setOfficial(s.value)}
                  className={`w-full text-left text-xs sm:text-sm px-3 py-2 rounded-lg border flex items-center gap-2 font-medium ${s.value === cur ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow' : done ? 'bg-indigo-50 text-indigo-900 border-indigo-200 font-semibold' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                  <span>{done ? '✔' : i + 1 + '.'}</span> {label}
                </button>
              </li>
            );
          })}
        </ol>
        <button disabled={busy} onClick={() => setOfficial('rejected')}
          className={`w-full text-left text-xs font-bold px-3 py-2.5 rounded-lg border transition ${cur === 'rejected' ? 'bg-red-600 text-white border-red-600 shadow' : 'text-red-700 border-red-200 bg-red-50/50 hover:bg-red-100'}`}>
          ⛔ {isMk ? REJECTED.labelMk : REJECTED.labelTr}
        </button>
      </div>

      {/* #9 Seyahat + işe başlangıç özeti */}
      <div className={box}>
        <h3 className="font-bold text-slate-900">🧳 {isMk ? 'Патување и започнување со работа' : 'Seyahat & İşe Başlangıç'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <Info k={isMk ? 'Патување' : 'Seyahat'} v={c.travel_status === 'planned' ? (isMk ? '✈️ Се планира' : '✈️ Planlanıyor') : c.travel_status === 'ticketed' ? (isMk ? '🎟️ Издаден билет' : '🎟️ Biletlendi') : c.travel_status === 'completed' ? (isMk ? '✅ Завршено' : '✅ Tamamlandı') : (c.travel_status || '—')} />
          <Info k={isMk ? 'Лет' : 'Uçuş'} v={[c.flight_date, c.flight_number].filter(Boolean).join(' · ') || '—'} />
          <Info k={isMk ? 'Рута' : 'Güzergâh'} v={[c.departure_city, c.arrival_city].filter(Boolean).join(' → ') || '—'} />
          <Info k="PNR" v={c.pnr_code || '—'} />
          <Info k={isMk ? 'Сместување' : 'Konaklama'} v={c.accommodation_details || '—'} />
          <Info k={isMk ? 'Работодавач / почеток' : 'İşveren / başlangıç'} v={offer ? `${offer.employer_name}${offer.start_date ? ' · ' + offer.start_date : ''} (${offer.status})` : (isMk ? 'Нема понуда' : 'Teklif yok')} />
        </div>
        <p className="text-[11px] text-slate-600 font-medium">{isMk ? 'Уреди ги информациите за лет во секцијата „Патување, лет и логистика“ подолу.' : 'Uçuş bilgilerini aşağıdaki “Seyahat, Uçuş ve Konaklama” bölümünden düzenleyip kaydedin.'}</p>
        {startedWork ? (
          <p className="text-sm font-bold text-emerald-700">✅ {isMk ? 'Кандидатот започна со работа — активен е 30/60/90 мониторинг.' : 'Aday işe başladı — 30/60/90 takibi aktif.'}</p>
        ) : (
          <button disabled={busy} onClick={() => setOfficial('started_work')} className="w-full sm:w-auto text-xs font-bold px-4 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow">
            {isMk ? 'Означи како започнато со работа' : 'İşe başladı olarak işaretle'}
          </button>
        )}
      </div>

      {/* #10 30/60/90 takip */}
      <div className={box}>
        <h3 className="font-bold text-slate-900">📆 {isMk ? '30 / 60 / 90 дена мониторинг' : '30 / 60 / 90 Gün Takibi'}</h3>
        <div className="grid grid-cols-3 gap-2">
          {STAGES.map((st) => {
            const r = fus.find((x) => String(x.period_stage) === st);
            return (
              <button key={st} onClick={() => setFu(r ? { ...emptyFu, ...r, compliance_score: r.compliance_score ?? '', check_date: r.check_date ?? '' } : { ...emptyFu, period_stage: st })}
                className={`p-3 rounded-xl border text-center text-xs transition cursor-pointer ${r ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-300 text-slate-800 font-semibold'} ${fu.period_stage === st ? 'ring-2 ring-indigo-500 bg-indigo-50 border-indigo-400' : ''}`}>
                <div className="font-extrabold text-sm sm:text-base text-slate-900">{st}. {isMk ? 'ден' : 'gün'}</div>
                <div className="text-xs font-bold mt-0.5">{r ? `${r.compliance_score ? '★'.repeat(r.compliance_score) : (isMk ? 'Запишано' : 'Kaydedildi')}` : (isMk ? 'Се чека' : 'Bekliyor')}</div>
                {r?.is_demo && <div className="mt-1"><DemoBadge /></div>}
              </button>
            );
          })}
        </div>
        {!startedWork && fus.length === 0 && <p className="text-[11px] text-amber-800 font-semibold">{isMk ? 'Забелешка: Кандидатот сè уште не е означен како „започнат со работа“.' : 'Not: Aday henüz “işe başladı” olarak işaretlenmedi.'}</p>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label className="text-xs font-bold text-slate-700 uppercase">{isMk ? 'Датум на проверка' : 'Kontrol tarihi'}
            <input type="date" className={inp} value={fu.check_date} onChange={(e) => setFu({ ...fu, check_date: e.target.value })} />
          </label>
          <label className="text-xs font-bold text-slate-700 uppercase">{isMk ? 'Рејтинг за усогласеност (1–5)' : 'Uyum puanı (1–5)'}
            <select className={inp} value={fu.compliance_score} onChange={(e) => setFu({ ...fu, compliance_score: e.target.value })}>
              <option value="">—</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" className="w-4 h-4 accent-indigo-600 rounded" checked={fu.salary_compliance} onChange={(e) => setFu({ ...fu, salary_compliance: e.target.checked })} /> 
            {isMk ? 'Платата е во согласност со договорот' : 'Maaş sözleşmeye uygun'}
          </label>
          <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" className="w-4 h-4 accent-indigo-600 rounded" checked={fu.accommodation_compliance} onChange={(e) => setFu({ ...fu, accommodation_compliance: e.target.checked })} /> 
            {isMk ? 'Сместувањето е соодветно' : 'Konaklama uygun'}
          </label>
          <textarea className={inp} rows={2} placeholder={isMk ? 'Повратна информација од работодавачот' : 'İşveren geri bildirimi'} value={fu.employer_feedback || ''} onChange={(e) => setFu({ ...fu, employer_feedback: e.target.value })} />
          <textarea className={inp} rows={2} placeholder={isMk ? 'Повратна информација од работникот' : 'Çalışan geri bildirimi'} value={fu.employee_feedback || ''} onChange={(e) => setFu({ ...fu, employee_feedback: e.target.value })} />
          <textarea className={`${inp} sm:col-span-2`} rows={2} placeholder={isMk ? 'Забелешка од Панова' : 'Panova notu'} value={fu.notes || ''} onChange={(e) => setFu({ ...fu, notes: e.target.value })} />
        </div>

        <button disabled={busy} onClick={saveFu} className="w-full sm:w-auto text-xs font-bold px-4 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow">
          {fu.id ? (isMk ? `Ажурирај мониторинг за ${fu.period_stage} ден` : `${fu.period_stage}. gün takibini güncelle`) : (isMk ? `Зачувај мониторинг за ${fu.period_stage} ден` : `${fu.period_stage}. gün takibini kaydet`)}
        </button>
      </div>
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
      <div className="text-[10px] font-bold uppercase text-slate-500">{k}</div>
      <div className="font-semibold text-slate-900 break-words">{v}</div>
    </div>
  );
}