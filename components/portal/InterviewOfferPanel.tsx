'use client';

import { useEffect, useState } from 'react';
import { X, CalendarPlus, FileSignature, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import DemoBadge from './DemoBadge';

const INT_STATUS = [
  { value: 'scheduled', label: '📅 Planlandı' },
  { value: 'completed', label: '✅ Tamamlandı' },
  { value: 'cancelled', label: '🚫 İptal' },
  { value: 'no_show', label: '⚠️ Katılmadı' },
];
const INT_RESULT = [
  { value: '', label: '— Sonuç yok —' },
  { value: 'selected', label: '⭐ Seçildi' },
  { value: 'backup', label: '🔁 Yedek' },
  { value: 'rejected', label: '❌ Uygun değil' },
];
const OFFER_STATUS: Record<string, string> = {
  pending: '⏳ Adayın yanıtı bekleniyor',
  accepted: '✅ Kabul edildi',
  rejected: '❌ Reddedildi',
  withdrawn: '↩️ Geri çekildi',
};

const toLocal = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

interface Props {
  candidate: { id: string; full_name?: string; profession?: string; is_demo?: boolean };
  request?: any | null;
  match?: any | null;
  onClose: () => void;
}

/** Görüşme planlama (interviews) + iş teklifi oluşturma (job_offers). Eşleşmeden veya aday dosyasından açılır. */
export default function InterviewOfferPanel({ candidate, request, match, onClose }: Props) {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const isDemo = !!(candidate.is_demo || request?.is_demo || match?.is_demo);

  const [iv, setIv] = useState<any>({ id: null, scheduled_at: '', status: 'scheduled', result: '', employer_notes: '', panova_notes: '' });
  const [of, setOf] = useState<any>({
    id: null,
    employer_name: request?.employer_name || '',
    position_title: request?.position_title || candidate.profession || '',
    monthly_net_salary: '',
    start_date: '',
    terms_details: '',
    status: 'pending',
  });

  const load = async () => {
    let qi = supabase.from('interviews').select('*').eq('candidate_id', candidate.id).order('scheduled_at', { ascending: false });
    let qo = supabase.from('job_offers').select('*').eq('candidate_id', candidate.id).order('created_at', { ascending: false });
    if (request?.id) {
      qi = qi.eq('request_id', request.id);
      qo = qo.eq('request_id', request.id);
    }
    const [i, o] = await Promise.all([qi, qo]);
    if (i.error || o.error) setError((i.error || o.error)!.message);
    setInterviews(i.data || []);
    setOffers(o.data || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate.id, request?.id]);

  const run = async (fn: () => PromiseLike<{ error: any }>, audit: string, type: string) => {
    setBusy(true);
    setError('');
    const { error } = await fn();
    if (error) setError(error.message);
    else await writeAudit(audit, type, candidate.id, { request_id: request?.id, match_id: match?.id });
    await load();
    setBusy(false);
    return !error;
  };

  const saveInterview = async () => {
    if (!iv.scheduled_at) return setError('Görüşme tarihi/saatini girin.');
    const row = {
      scheduled_at: new Date(iv.scheduled_at).toISOString(),
      status: iv.status,
      result: iv.result || null,
      employer_notes: iv.employer_notes || null,
      panova_notes: iv.panova_notes || null,
      updated_at: new Date().toISOString(),
    };
    const ok = await run(
      async () =>
        iv.id
          ? supabase.from('interviews').update(row).eq('id', iv.id)
          : supabase.from('interviews').insert({ ...row, candidate_id: candidate.id, request_id: request?.id ?? null, employer_id: request?.employer_id ?? null, is_demo: isDemo }),
      `${iv.id ? 'Görüşme güncellendi' : 'Görüşme planlandı'}: ${candidate.full_name} (${iv.status}${iv.result ? '/' + iv.result : ''})`,
      'interview'
    );
    // Görüşme sonucu "seçildi" ise eşleşmeyi de güncelle
    if (ok && match?.id && iv.result === 'selected' && match.employer_result !== 'selected') {
      await supabase.from('request_matches').update({ employer_result: 'selected' }).eq('id', match.id);
    }
    if (ok) setIv({ id: null, scheduled_at: '', status: 'scheduled', result: '', employer_notes: '', panova_notes: '' });
  };

  const saveOffer = async () => {
    if (!of.employer_name || !of.monthly_net_salary) return setError('Firma adı ve net maaş zorunlu.');
    const row = {
      employer_name: of.employer_name,
      position_title: of.position_title || null,
      monthly_net_salary: Number(of.monthly_net_salary),
      start_date: of.start_date || null,
      terms_details: of.terms_details || null,
      status: of.status,
      updated_at: new Date().toISOString(),
    };
    const ok = await run(
      async () =>
        of.id
          ? supabase.from('job_offers').update(row).eq('id', of.id)
          : supabase.from('job_offers').insert({ ...row, status: 'pending', candidate_id: candidate.id, request_id: request?.id ?? null, employer_id: request?.employer_id ?? null, is_demo: isDemo }),
      `${of.id ? 'İş teklifi güncellendi' : 'İş teklifi oluşturuldu'}: ${candidate.full_name} · ${row.monthly_net_salary}`,
      'job_offer'
    );
    if (ok) setOf({ ...of, id: null, monthly_net_salary: '', start_date: '', terms_details: '', status: 'pending' });
  };

  const inp = 'w-full border rounded-xl px-3 py-2 text-sm';
  const offerLocked = (o: any) => o.status === 'accepted' || o.status === 'rejected';

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">🤝 Görüşme & Teklif<DemoBadge show={isDemo} /></h3>
            <p className="text-xs text-slate-500">
              {candidate.full_name}
              {request ? ` · ${request.position_title} · ${request.employer_name}` : ' · tüm talepler'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Kapat"><X className="w-5 h-5" /></button>
        </div>

        {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

        {/* GÖRÜŞMELER */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-600">Görüşmeler ({interviews.length})</h4>
          {interviews.map((i) => (
            <button key={i.id} onClick={() => setIv({ id: i.id, scheduled_at: toLocal(i.scheduled_at), status: i.status || 'scheduled', result: i.result || '', employer_notes: i.employer_notes || '', panova_notes: i.panova_notes || '' })}
              className={`w-full text-left border rounded-xl p-3 hover:bg-slate-50 ${iv.id === i.id ? 'ring-2 ring-blue-500' : ''}`}>
              <p className="text-sm font-bold text-slate-900">
                {i.scheduled_at ? new Date(i.scheduled_at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tarih yok'}
                <DemoBadge show={i.is_demo} />
              </p>
              <p className="text-[11px] text-slate-500">
                {INT_STATUS.find((s) => s.value === i.status)?.label || i.status}
                {i.result ? ` · ${INT_RESULT.find((r) => r.value === i.result)?.label || i.result}` : ''}
                {i.panova_notes ? ` · ${i.panova_notes}` : ''}
              </p>
            </button>
          ))}
          <div className="border rounded-xl p-3 bg-slate-50 space-y-2">
            <p className="text-xs font-bold text-slate-700">{iv.id ? 'Görüşmeyi düzenle' : 'Yeni görüşme planla'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input type="datetime-local" value={iv.scheduled_at} onChange={(e) => setIv({ ...iv, scheduled_at: e.target.value })} className={inp} />
              <select value={iv.status} onChange={(e) => setIv({ ...iv, status: e.target.value })} className={inp}>
                {INT_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select value={iv.result} onChange={(e) => setIv({ ...iv, result: e.target.value })} className={inp}>
                {INT_RESULT.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <textarea rows={2} placeholder="İşveren notu" value={iv.employer_notes} onChange={(e) => setIv({ ...iv, employer_notes: e.target.value })} className={inp} />
            <textarea rows={2} placeholder="PANOVA iç notu" value={iv.panova_notes} onChange={(e) => setIv({ ...iv, panova_notes: e.target.value })} className={inp} />
            <div className="flex gap-2 justify-end">
              {iv.id && <button onClick={() => setIv({ id: null, scheduled_at: '', status: 'scheduled', result: '', employer_notes: '', panova_notes: '' })} className="text-xs px-3 py-2 rounded-lg border">Yeni</button>}
              <button disabled={busy} onClick={saveInterview} className="text-xs font-bold px-3 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-1 disabled:opacity-50">
                {iv.id ? <Save className="w-4 h-4" /> : <CalendarPlus className="w-4 h-4" />} {iv.id ? 'Kaydet' : 'Planla'}
              </button>
            </div>
          </div>
        </section>

        {/* TEKLİFLER */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-600">İş teklifleri ({offers.length})</h4>
          {offers.map((o) => (
            <button key={o.id} disabled={offerLocked(o)} onClick={() => setOf({ id: o.id, employer_name: o.employer_name || '', position_title: o.position_title || '', monthly_net_salary: o.monthly_net_salary ?? '', start_date: o.start_date || '', terms_details: o.terms_details || '', status: o.status || 'pending' })}
              className={`w-full text-left border rounded-xl p-3 hover:bg-slate-50 disabled:cursor-default ${of.id === o.id ? 'ring-2 ring-emerald-500' : ''}`}>
              <p className="text-sm font-bold text-slate-900">{o.employer_name} · {o.position_title}<DemoBadge show={o.is_demo} /></p>
              <p className="text-[11px] text-slate-500">
                {o.monthly_net_salary} net/ay · başlangıç {o.start_date || '—'} · {OFFER_STATUS[o.status] || o.status}
                {o.responded_at ? ` (${o.responded_at.substring(0, 10)})` : ''}
              </p>
            </button>
          ))}
          <div className="border rounded-xl p-3 bg-slate-50 space-y-2">
            <p className="text-xs font-bold text-slate-700">{of.id ? 'Teklifi düzenle' : 'Yeni iş teklifi (aday portalında görünür)'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input placeholder="Firma adı *" value={of.employer_name} onChange={(e) => setOf({ ...of, employer_name: e.target.value })} className={inp} />
              <input placeholder="Pozisyon" value={of.position_title} onChange={(e) => setOf({ ...of, position_title: e.target.value })} className={inp} />
              <input type="number" inputMode="decimal" placeholder="Net maaş / ay *" value={of.monthly_net_salary} onChange={(e) => setOf({ ...of, monthly_net_salary: e.target.value })} className={inp} />
              <input type="date" value={of.start_date} onChange={(e) => setOf({ ...of, start_date: e.target.value })} className={inp} />
            </div>
            <textarea rows={3} placeholder="Şartlar: konaklama, yemek, ulaşım, sözleşme süresi, çalışma saatleri…" value={of.terms_details} onChange={(e) => setOf({ ...of, terms_details: e.target.value })} className={inp} />
            {of.id && (
              <select value={of.status} onChange={(e) => setOf({ ...of, status: e.target.value })} className={inp}>
                <option value="pending">{OFFER_STATUS.pending}</option>
                <option value="withdrawn">{OFFER_STATUS.withdrawn}</option>
              </select>
            )}
            <div className="flex gap-2 justify-end">
              {of.id && <button onClick={() => setOf({ ...of, id: null, status: 'pending' })} className="text-xs px-3 py-2 rounded-lg border">Yeni</button>}
              <button disabled={busy} onClick={saveOffer} className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-600 text-white flex items-center gap-1 disabled:opacity-50">
                <FileSignature className="w-4 h-4" /> {of.id ? 'Kaydet' : 'Teklifi gönder'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
