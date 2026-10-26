'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import DemoBadge from '@/components/portal/DemoBadge';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import { Card, Stat, Field, REQUEST_STATUS, RESULT_LABEL, fmtDate } from '@/components/portal/file/ui';

const EDITABLE = ['contact_person', 'contact_name', 'email', 'phone', 'country', 'city', 'website', 'address', 'tax_id', 'assigned_sector', 'compliance_status', 'suitability_status', 'notes'] as const;
const LABELS: Record<string, string> = {
  contact_person: 'Yetkili kişi', contact_name: 'İkinci irtibat', email: 'E-posta', phone: 'Telefon', country: 'Ülke', city: 'Şehir',
  website: 'Web sitesi', address: 'Adres', tax_id: 'Vergi no', assigned_sector: 'Sektör', compliance_status: 'Uyum durumu',
  suitability_status: 'Uygunluk durumu', notes: 'İç notlar',
};

function EmployerFileInner() {
  const { id } = useParams() as { id: string };
  const [emp, setEmp] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [requests, setRequests] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [cands, setCands] = useState<Record<string, any>>({});
  const [tickets, setTickets] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    const { data: e } = await supabase.from('employers').select('*').eq('id', id).maybeSingle();
    setEmp(e);
    if (e) {
      setForm(Object.fromEntries(EDITABLE.map((k) => [k, e[k] ?? ''])));
      const [byId, byName] = await Promise.all([
        supabase.from('job_requests').select('*').eq('employer_id', id),
        e.company_name ? supabase.from('job_requests').select('*').is('employer_id', null).eq('employer_name', e.company_name) : Promise.resolve({ data: [] as any[] }),
      ]);
      const reqs = [...(byId.data || []), ...((byName as any).data || [])].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      const rq = reqs || [];
      setRequests(rq);
      const reqIds = rq.map((r) => r.id);
      const [m, t, tk, iv] = await Promise.all([
        reqIds.length ? supabase.from('request_matches').select('*').in('request_id', reqIds) : Promise.resolve({ data: [] as any[] }),
        supabase.from('candidate_support_tickets').select('*').eq('employer_id', id).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('related_entity_type', 'employer').eq('related_entity_id', id),
        supabase.from('interviews').select('*').eq('employer_id', id),
      ]);
      const mm = (m as any).data || [];
      setMatches(mm);
      setTickets(t.data || []);
      setTasks(tk.data || []);
      setInterviews(iv.data || []);
      const cids = Array.from(new Set(mm.map((x: any) => x.candidate_id)));
      if (cids.length) {
        const { data: c } = await supabase.from('job_candidates').select('id, full_name, profession, nationality, is_demo').in('id', cids);
        setCands(Object.fromEntries((c || []).map((x) => [x.id, x])));
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const save = async () => {
    if (!emp) return;
    setSaving(true); setMsg('');
    const changes: Record<string, string | null> = {};
    for (const k of EDITABLE) if ((emp[k] ?? '') !== form[k]) changes[k] = form[k] || null;
    if (!Object.keys(changes).length) { setSaving(false); setMsg('Değişiklik yok.'); return; }
    const { error } = await supabase.from('employers').update(changes).eq('id', id);
    if (error) setMsg('Hata: ' + error.message);
    else {
      await writeAudit(`İşveren dosyası güncellendi: ${emp.company_name}`, 'employer', id, { fields: Object.keys(changes) });
      setEmp({ ...emp, ...changes }); setMsg('Kaydedildi ✓');
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold">Yükleniyor...</div>;
  if (!emp) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">İşveren bulunamadı.</div>;

  const active = requests.filter((r) => !['completed', 'cancelled'].includes(r.status) && !r.archived_at);
  const presented = matches.filter((m) => m.presented_at);
  const selected = matches.filter((m) => m.employer_result === 'selected');
  const openTickets = tickets.filter((t) => !['closed', 'resolved'].includes(t.status));
  const openTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'done');
  const reqTitle = Object.fromEntries(requests.map((r) => [r.id, r.position_title]));

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <Link href="/portal" className="text-xs font-bold text-slate-500 hover:text-slate-800">← Yönetim paneline dön</Link>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900">🏢 {emp.company_name}<DemoBadge show={emp.is_demo} /></h1>
            <div className="text-[11px] text-slate-500 flex flex-wrap gap-2">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">PNV-EMP-{emp.id.substring(0, 6)}</span>
              <span>📍 {emp.country || '—'}{emp.city ? `, ${emp.city}` : ''}</span>
              <span>💼 {emp.assigned_sector || '—'}</span>
              <span>📅 Kayıt: {fmtDate(emp.created_at)}</span>
            </div>
          </div>
          <button onClick={save} disabled={saving} className="w-full sm:w-auto bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow">
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
          </button>
        </div>
        {msg && <div className="text-xs font-bold text-slate-700">{msg}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Aktif talep" value={active.length} />
          <Stat label="Sunulan aday" value={presented.length} />
          <Stat label="Seçilen aday" value={selected.length} />
          <Stat label="Açık sorun / görev" value={openTickets.length + openTasks.length} />
        </div>

        <Card title="Firma ve iletişim bilgileri">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EDITABLE.filter((k) => k !== 'notes').map((k) => (
              <Field key={k} label={LABELS[k]} value={form[k] || ''} onChange={(v) => setForm({ ...form, [k]: v })} type={k === 'email' ? 'email' : 'text'} />
            ))}
          </div>
          <Field label={LABELS.notes} value={form.notes || ''} onChange={(v) => setForm({ ...form, notes: v })} textarea />
        </Card>

        <Card title={`Personel talepleri (${requests.length})`}>
          {requests.length === 0 ? <p className="text-xs text-slate-400">Talep yok.</p> : (
            <ul className="divide-y">
              {requests.map((r) => (
                <li key={r.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm">
                  <div>
                    <Link href={`/portal/requests/${r.id}`} className="font-bold text-emerald-700 hover:underline">{r.position_title}</Link>
                    <DemoBadge show={r.is_demo} />
                    <div className="text-[11px] text-slate-500">{r.headcount || 0} kişi · {r.city || '—'}, {r.country || '—'} · Başlangıç {fmtDate(r.target_start_date)}</div>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{REQUEST_STATUS[r.status] || r.status || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={`Sunulan / seçilen adaylar (${presented.length})`}>
          {presented.length === 0 ? <p className="text-xs text-slate-400">Henüz aday sunulmadı.</p> : (
            <ul className="divide-y">
              {presented.map((m) => {
                const c = cands[m.candidate_id];
                return (
                  <li key={m.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm">
                    <div>
                      <Link href={`/portal/candidates/${m.candidate_id}`} className="font-bold text-slate-900 hover:underline">{c?.full_name || 'Aday'}</Link>
                      <DemoBadge show={m.is_demo} />
                      <div className="text-[11px] text-slate-500">{c?.profession || '—'} · {reqTitle[m.request_id] || '—'} · Sunum {fmtDate(m.presented_at)}</div>
                    </div>
                    <span className="text-xs font-bold">{RESULT_LABEL[m.employer_result] || '— Sonuç bekleniyor'}</span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-[11px] text-slate-500">Görüşme kaydı: {interviews.length}</p>
        </Card>

        <Card title={`Açık sorunlar ve görevler (${openTickets.length + openTasks.length})`}>
          {openTickets.length + openTasks.length === 0 ? <p className="text-xs text-slate-400">Açık kayıt yok.</p> : (
            <ul className="divide-y text-sm">
              {openTickets.map((t) => (
                <li key={t.id} className="py-2">🎫 <strong>{t.subject}</strong><DemoBadge show={t.is_demo} /> <span className="text-[11px] text-slate-500">· {t.candidate_name || ''} · {t.status} · {fmtDate(t.created_at)}</span></li>
              ))}
              {openTasks.map((t) => (
                <li key={t.id} className="py-2">✅ <strong>{t.title}</strong><DemoBadge show={t.is_demo} /> <span className="text-[11px] text-slate-500">· {t.assignee || '—'} · {t.status} · Son {fmtDate(t.due_date)}</span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function EmployerFilePage() {
  return (
    <AuthGuard role="staff">
      <EmployerFileInner />
    </AuthGuard>
  );
}
