'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import DemoBadge from '@/components/portal/DemoBadge';
import MatchPanel from '@/components/portal/MatchPanel';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import { Card, Stat, Field, REQUEST_STATUS, RESULT_LABEL, fmtDate } from '@/components/portal/file/ui';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import { translations } from '@/lib/dictionary';
import { useSiteLanguage } from '@/lib/site-language';

const TEXT_FIELDS: [string, string, string?][] = [
  ['position_title', 'Pozisyon'], ['sector', 'Sektör'], ['headcount', 'Kişi sayısı', 'number'],
  ['target_start_date', 'Hedef başlangıç', 'date'], ['monthly_net_salary', 'Aylık net maaş', 'number'],
  ['working_hours', 'Çalışma saatleri'], ['weekly_days', 'Haftalık gün'], ['overtime_conditions', 'Mesai koşulları'],
  ['contract_type', 'Sözleşme tipi'], ['required_experience_years', 'Gerekli deneyim (yıl)', 'number'],
  ['required_language', 'Dil şartı'], ['country', 'Ülke'], ['city', 'Şehir'],
];
const BOOL_FIELDS: [string, string][] = [
  ['accommodation_provided', 'Konaklama'], ['food_provided', 'Yemek'], ['transport_provided', 'Ulaşım'],
  ['flight_covered', 'Uçak bileti'], ['required_certificate', 'Sertifika şartı'],
];
const NUMERIC = new Set(['headcount', 'monthly_net_salary', 'required_experience_years']);

function RequestFileInner() {
  const { id } = useParams() as { id: string };
  const [req, setReq] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [matches, setMatches] = useState<any[]>([]);
  const [cands, setCands] = useState<Record<string, any>>({});
  const [interviews, setInterviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [showMatch, setShowMatch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const { currentLang, changeLanguage, isRtl } = useSiteLanguage('tr');
  const t = translations[currentLang] || translations.tr;

  const load = async () => {
    const { data: r } = await supabase.from('job_requests').select('*').eq('id', id).maybeSingle();
    setReq(r);
    if (r) {
      setForm({ ...r, special_requirements: r.special_requirements || '', closed_reason: r.closed_reason || '' });
      const [m, iv, of] = await Promise.all([
        supabase.from('request_matches').select('*').eq('request_id', id).order('created_at'),
        supabase.from('interviews').select('*').eq('request_id', id).order('scheduled_at'),
        supabase.from('job_offers').select('*').eq('request_id', id),
      ]);
      setMatches(m.data || []); setInterviews(iv.data || []); setOffers(of.data || []);
      const cids = Array.from(new Set((m.data || []).map((x) => x.candidate_id)));
      if (cids.length) {
        const { data: c } = await supabase.from('job_candidates').select('id, full_name, profession, nationality, is_demo').in('id', cids);
        setCands(Object.fromEntries((c || []).map((x) => [x.id, x])));
      } else setCands({});
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const save = async () => {
    if (!req) return;
    setSaving(true); setMsg('');
    const keys = [...TEXT_FIELDS.map((f) => f[0]), ...BOOL_FIELDS.map((f) => f[0]), 'status', 'special_requirements', 'closed_reason'];
    const changes: Record<string, any> = {};
    for (const k of keys) {
      let v = form[k];
      if (NUMERIC.has(k)) v = v === '' || v == null ? null : Number(v);
      else if (typeof v === 'string') v = v === '' ? null : v;
      if ((req[k] ?? null) !== (v ?? null)) changes[k] = v;
    }
    if (changes.status === 'cancelled' || changes.status === 'completed') changes.closed_at = new Date().toISOString();
    if (!Object.keys(changes).length) { setSaving(false); setMsg('Değişiklik yok.'); return; }
    const { error } = await supabase.from('job_requests').update(changes).eq('id', id);
    if (error) setMsg('Hata: ' + error.message);
    else {
      await writeAudit(`Personel talebi güncellendi: ${req.position_title}`, 'job_request', id, { fields: Object.keys(changes), status: changes.status });
      setReq({ ...req, ...changes }); setMsg('Kaydedildi ✓');
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">Yükleniyor...</div>;
  if (!req) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">Talep bulunamadı.</div>;

  const presented = matches.filter((m) => m.presented_at).length;
  const selected = matches.filter((m) => m.employer_result === 'selected').length;
  const accepted = offers.filter((o) => o.status === 'accepted').length;

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {showMatch && <MatchPanel request={req} onClose={() => { setShowMatch(false); load(); }} />}
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <Link href="/portal" className="text-xs font-bold text-slate-500 hover:text-slate-800">← {t.returnToPortal || t.returnHome}</Link>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900">📋 {req.position_title}<DemoBadge show={req.is_demo} /></h1>
            <div className="text-[11px] text-slate-500 flex flex-wrap gap-2">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">PNV-REQ-{req.id.substring(0, 6)}</span>
              {req.employer_id ? (
                <Link href={`/portal/employers/${req.employer_id}`} className="font-bold text-emerald-700 hover:underline">🏢 {req.employer_name || 'İşveren'}</Link>
              ) : <span>🏢 {req.employer_name || '—'}</span>}
              <span>📅 Oluşturma: {fmtDate(req.created_at)}</span>
              <span className="font-bold text-slate-700">{REQUEST_STATUS[req.status] || req.status}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button onClick={() => setShowMatch(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow">🔗 Aday eşleştir</button>
            <LanguageSwitcher currentLang={currentLang} onChange={changeLanguage} />
            <button onClick={save} disabled={saving} className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow">{saving ? (t.saving || '...') : (t.saveBtn || 'Kaydet')}</button>
          </div>
        </div>
        {msg && <div className="text-xs font-bold text-slate-700">{msg}</div>}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Eşleşen aday" value={matches.length} />
          <Stat label="Sunulan" value={presented} />
          <Stat label="Seçilen" value={`${selected}/${req.headcount || 0}`} />
          <Stat label="Görüşme" value={interviews.length} />
          <Stat label="Teklif (kabul)" value={`${offers.length} (${accepted})`} />
        </div>

        <Card title="Talep bilgileri">
          <label className="block text-xs font-bold text-slate-600 space-y-1">
            <span>Durum</span>
            <select value={form.status || 'new_request'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              {Object.entries(REQUEST_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          {(form.status === 'cancelled' || form.status === 'completed') && (
            <Field label="Kapanış nedeni" value={form.closed_reason || ''} onChange={(v) => setForm({ ...form, closed_reason: v })} />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEXT_FIELDS.map(([k, l, type]) => (
              <Field key={k} label={l} type={type} value={form[k] == null ? '' : String(form[k]).substring(0, type === 'date' ? 10 : undefined)} onChange={(v) => setForm({ ...form, [k]: v })} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {BOOL_FIELDS.map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 border rounded-xl px-3 py-2">
                <input type="checkbox" className="w-4 h-4" checked={!!form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} /> {l}
              </label>
            ))}
          </div>
          <Field label="Özel şartlar" textarea value={form.special_requirements || ''} onChange={(v) => setForm({ ...form, special_requirements: v })} />
        </Card>

        <Card title={`Eşleşen adaylar (${matches.length})`} right={<button onClick={() => setShowMatch(true)} className="text-xs font-bold text-emerald-700">Yönet →</button>}>
          {matches.length === 0 ? <p className="text-xs text-slate-400">Henüz aday bağlanmadı.</p> : (
            <ul className="divide-y">
              {matches.map((m) => {
                const c = cands[m.candidate_id];
                const ivs = interviews.filter((i) => i.candidate_id === m.candidate_id);
                const of = offers.find((o) => o.candidate_id === m.candidate_id);
                return (
                  <li key={m.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm">
                    <div>
                      <Link href={`/portal/candidates/${m.candidate_id}`} className="font-bold text-slate-900 hover:underline">{c?.full_name || 'Aday'}</Link>
                      <DemoBadge show={m.is_demo} />
                      <div className="text-[11px] text-slate-500">{c?.profession || '—'} · {c?.nationality || '—'} · {m.presented_at ? `Sunuldu ${fmtDate(m.presented_at)}` : 'Sunulmadı'} · Görüşme {ivs.length}{of ? ` · Teklif: ${of.status}` : ''}</div>
                    </div>
                    <span className="text-xs font-bold">{RESULT_LABEL[m.employer_result] || '—'}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title={`Görüşmeler (${interviews.length})`}>
          {interviews.length === 0 ? <p className="text-xs text-slate-400">Görüşme yok.</p> : (
            <ul className="divide-y text-sm">
              {interviews.map((i) => (
                <li key={i.id} className="py-2">🤝 <strong>{cands[i.candidate_id]?.full_name || 'Aday'}</strong><DemoBadge show={i.is_demo} /> <span className="text-[11px] text-slate-500">· {i.scheduled_at ? new Date(i.scheduled_at).toLocaleString('tr-TR') : 'Tarih yok'} · {i.status || '—'}{i.result ? ` · ${RESULT_LABEL[i.result] || i.result}` : ''}</span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function RequestFilePage() {
  return (
    <AuthGuard role="staff">
      <RequestFileInner />
    </AuthGuard>
  );
}
