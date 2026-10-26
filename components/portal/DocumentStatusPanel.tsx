'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import DemoBadge from './DemoBadge';

const DOC_TYPES: Record<string, string> = {
  passport: 'Pasaport', cv: 'CV', certificate: 'Sertifika', diploma: 'Diploma',
  criminal_record: 'Sabıka kaydı', health_report: 'Sağlık raporu', photo: 'Fotoğraf', contract: 'Sözleşme',
};
const STATUSES: Record<string, string> = {
  pending: '🟡 Bekleniyor', uploaded: '📥 Yüklendi', reviewing: '🔵 İnceleniyor', approved: '🟢 Onaylandı',
  rejected: '🔴 Reddedildi', rerequested: '🔁 Yeniden istendi', expiring: '⚠️ Süresi doluyor', expired: '⛔ Süresi doldu',
};

/** candidate_documents tablosu üzerinden belge durumu takibi (staff). */
export default function DocumentStatusPanel({ candidateId }: { candidateId: string }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [newType, setNewType] = useState('passport');
  const [error, setError] = useState('');

  const load = async () => {
    const { data, error } = await supabase.from('candidate_documents').select('*').eq('candidate_id', candidateId).order('created_at');
    if (error) setError(error.message);
    setDocs(data || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [candidateId]);

  const update = async (d: any, patch: Record<string, unknown>, label: string) => {
    setError('');
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('candidate_documents').update({ ...patch, reviewed_at: new Date().toISOString(), reviewed_by: u.user?.id ?? null }).eq('id', d.id);
    if (error) return setError(error.message);
    await writeAudit(`Belge ${DOC_TYPES[d.doc_type] || d.doc_type}: ${label}`, 'candidate', candidateId, { document_id: d.id, ...patch });
    load();
  };

  const add = async () => {
    setError('');
    const { error } = await supabase.from('candidate_documents').insert({ candidate_id: candidateId, doc_type: newType, status: 'pending' });
    if (error) return setError(error.message);
    await writeAudit(`Belge talep edildi: ${DOC_TYPES[newType] || newType}`, 'candidate', candidateId);
    load();
  };

  const approved = docs.filter((d) => d.status === 'approved').length;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-3">
      <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b pb-2 flex justify-between">
        <span>📄 Belge Durumu</span>
        <span className="text-xs text-slate-500">{approved}/{docs.length} onaylı</span>
      </h3>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {docs.length === 0 && <p className="text-xs text-slate-400">Kayıtlı belge yok.</p>}
      {docs.map((d) => (
        <div key={d.id} className="border rounded-xl p-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800">{DOC_TYPES[d.doc_type] || d.doc_type}<DemoBadge show={d.is_demo} /></span>
            {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer" className="text-[11px] text-blue-600 underline">Aç</a>}
          </div>
          <select value={d.status} onChange={(e) => update(d, { status: e.target.value }, STATUSES[e.target.value])} className="w-full text-xs border rounded-lg px-2 py-2 bg-slate-50">
            {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <label className="flex items-center gap-2 text-[11px] text-slate-500">
            Geçerlilik:
            <input type="date" defaultValue={d.valid_until || ''} onBlur={(e) => e.target.value !== (d.valid_until || '') && update(d, { valid_until: e.target.value || null }, `geçerlilik ${e.target.value}`)} className="border rounded px-1 py-0.5" />
          </label>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <select value={newType} onChange={(e) => setNewType(e.target.value)} className="flex-1 text-xs border rounded-lg px-2 py-2">
          {Object.entries(DOC_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button onClick={add} className="text-xs font-bold px-3 py-2 rounded-lg bg-slate-900 text-white">+ Talep et</button>
      </div>
    </div>
  );
}
