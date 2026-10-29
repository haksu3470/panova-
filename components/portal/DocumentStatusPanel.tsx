'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import DemoBadge from './DemoBadge';
import { Language, translations } from '@/lib/dictionary';
import { readStoredLanguage } from '@/lib/site-language';

const DOC_TYPES: Record<string, { tr: string; mk: string }> = {
  passport: { tr: 'Pasaport', mk: 'Пасош' },
  cv: { tr: 'CV', mk: 'ЦВ' },
  certificate: { tr: 'Sertifika', mk: 'Сертификат' },
  diploma: { tr: 'Diploma', mk: 'Диплома' },
  criminal_record: { tr: 'Sabıka kaydı', mk: 'Казнена евиденција' },
  health_report: { tr: 'Sağlık raporu', mk: 'Здравствен извештај' },
  photo: { tr: 'Fotoğraf', mk: 'Фотографија' },
  contract: { tr: 'Sözleşme', mk: 'Договор' },
  apostille: { tr: 'e-Apostil', mk: 'е-Апостил' },
  other: { tr: 'Diğer', mk: 'Друго' },
};

const STATUSES: Record<string, { tr: string; mk: string }> = {
  pending: { tr: '🟡 Bekleniyor', mk: '🟡 Се чека' },
  uploaded: { tr: '📥 Yüklendi', mk: '📥 Прикачено' },
  reviewing: { tr: '🔵 İnceleniyor', mk: '🔵 Се разгледува' },
  approved: { tr: '🟢 Onaylandı', mk: '🟢 Одобрено' },
  rejected: { tr: '🔴 Reddedildi', mk: '🔴 Одбиено' },
  rerequested: { tr: '🔁 Yeniden istendi', mk: '🔁 Повторно побарано' },
  expiring: { tr: '⚠️ Süresi doluyor', mk: '⚠️ Истекува рокот' },
  expired: { tr: '⛔ Süresi doldu', mk: '⛔ Истечен рок' },
};

/** candidate_documents tablosu üzerinden belge durumu takibi (staff). */
export default function DocumentStatusPanel({ candidateId }: { candidateId: string }) {
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

  const isMk = currentLang === 'mk';

  const [docs, setDocs] = useState<any[]>([]);
  const [newType, setNewType] = useState('passport');
  const [error, setError] = useState('');

  const load = async () => {
    const { data, error } = await supabase.from('candidate_documents').select('*').eq('candidate_id', candidateId).order('created_at');
    if (error) setError(error.message);
    setDocs(data || []);
  };

  useEffect(() => {
    load();
  }, [candidateId]);

  const update = async (d: any, patch: Record<string, unknown>, label: string) => {
    setError('');
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from('candidate_documents').update({ ...patch, reviewed_at: new Date().toISOString(), reviewed_by: u.user?.id ?? null }).eq('id', d.id);
    if (error) return setError(error.message);
    
    const docName = DOC_TYPES[d.doc_type]?.[isMk ? 'mk' : 'tr'] || d.doc_type;
    await writeAudit(`Belge ${docName}: ${label}`, 'candidate', candidateId, { document_id: d.id, ...patch });
    load();
  };

  const add = async () => {
    setError('');
    const { error } = await supabase.from('candidate_documents').insert({ candidate_id: candidateId, doc_type: newType, status: 'pending' });
    if (error) return setError(error.message);
    
    const docName = DOC_TYPES[newType]?.[isMk ? 'mk' : 'tr'] || newType;
    await writeAudit(`Belge talep edildi: ${docName}`, 'candidate', candidateId);
    load();
  };

  const approved = docs.filter((d) => d.status === 'approved').length;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex justify-between items-center">
        <span className="flex items-center gap-1.5">📄 {isMk ? 'Статус на документи' : 'Belge Durumu'}</span>
        <span className="text-xs text-slate-600 font-bold">{approved}/{docs.length} {isMk ? 'одобрени' : 'onaylı'}</span>
      </h3>
      {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
      {docs.length === 0 && <p className="text-xs text-slate-500 font-medium">{isMk ? 'Нема снимени документи.' : 'Kayıtlı belge yok.'}</p>}
      
      {docs.map((d) => {
        const typeObj = DOC_TYPES[d.doc_type];
        const typeLabel = typeObj ? (isMk ? typeObj.mk : typeObj.tr) : d.doc_type;
        return (
          <div key={d.id} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                {typeLabel} <DemoBadge show={d.is_demo} />
              </span>
              {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 underline hover:text-blue-800">{isMk ? 'Отвори' : 'Aç'}</a>}
            </div>
            
            <select 
              value={d.status} 
              onChange={(e) => {
                const stObj = STATUSES[e.target.value];
                const stLabel = stObj ? (isMk ? stObj.mk : stObj.tr) : e.target.value;
                update(d, { status: e.target.value }, stLabel);
              }} 
              className="w-full text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-900 outline-none cursor-pointer"
            >
              {Object.entries(STATUSES).map(([v, l]) => <option key={v} value={v}>{isMk ? l.mk : l.tr}</option>)}
            </select>

            <label className="flex items-center gap-2 text-xs text-slate-700 font-bold pt-0.5">
              {isMk ? 'Валидно до:' : 'Geçerlilik:'}
              <input type="date" defaultValue={d.valid_until || ''} onBlur={(e) => e.target.value !== (d.valid_until || '') && update(d, { valid_until: e.target.value || null }, `geçerlilik ${e.target.value}`)} className="border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold bg-white text-slate-900 outline-none" />
            </label>
          </div>
        );
      })}

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <select value={newType} onChange={(e) => setNewType(e.target.value)} className="flex-1 text-xs font-bold border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-slate-900 outline-none cursor-pointer">
          {Object.entries(DOC_TYPES).map(([v, l]) => <option key={v} value={v}>{isMk ? l.mk : l.tr}</option>)}
        </select>
        <button onClick={add} className="text-xs font-bold px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow">
          {isMk ? '+ Побарај' : '+ Talep et'}
        </button>
      </div>
    </div>
  );
}