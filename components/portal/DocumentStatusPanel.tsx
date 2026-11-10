'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import DemoBadge from './DemoBadge';
import { portalUi } from '@/lib/portal-ui-copy';
import { useSiteLanguage } from '@/lib/site-language';
import DeleteRecordButton from './DeleteRecordButton';
import { useStaffRole } from './useStaffRole';
import { openCandidateDocument } from '@/lib/candidateFiles';
import { releaseCopy } from '@/lib/release-copy';

const DOC_TYPE_KEYS = ['passport', 'cv', 'certificate', 'diploma', 'criminal_record', 'health_report', 'photo', 'contract', 'apostille', 'other'] as const;
const STATUS_KEYS = ['pending', 'uploaded', 'reviewing', 'approved', 'rejected', 'rerequested', 'expiring', 'expired'] as const;

/** candidate_documents status tracking for staff. */
export default function DocumentStatusPanel({ candidateId }: { candidateId: string }) {
  const { currentLang } = useSiteLanguage('en');
  const ui = portalUi[currentLang];
  const { upper } = useStaffRole();

  const [docs, setDocs] = useState<any[]>([]);
  const [newType, setNewType] = useState('passport');
  const [error, setError] = useState('');

  const load = async () => {
    const { data, error: loadError } = await supabase.from('candidate_documents').select('*').eq('candidate_id', candidateId).order('created_at');
    if (loadError) setError(loadError.message);
    setDocs(data || []);
  };

  useEffect(() => {
    load();
  }, [candidateId]);

  const typeName = (key: string) => ui.docTypes[key] || key;
  const statusName = (key: string) => ui.docStatuses[key] || key;

  const update = async (d: any, patch: Record<string, unknown>, label: string) => {
    setError('');
    const { data: u } = await supabase.auth.getUser();
    const { error: updateError } = await supabase.from('candidate_documents').update({ ...patch, reviewed_at: new Date().toISOString(), reviewed_by: u.user?.id ?? null }).eq('id', d.id);
    if (updateError) return setError(updateError.message);
    await writeAudit(`${ui.docTitle} ${typeName(d.doc_type)}: ${label}`, 'candidate', candidateId, { document_id: d.id, ...patch });
    load();
  };

  const add = async () => {
    setError('');
    const { error: insertError } = await supabase.from('candidate_documents').insert({ candidate_id: candidateId, doc_type: newType, status: 'pending' });
    if (insertError) return setError(insertError.message);
    await writeAudit(`${ui.docRequest} ${typeName(newType)}`, 'candidate', candidateId);
    load();
  };

  const approved = docs.filter((d) => d.status === 'approved').length;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex justify-between items-center gap-2">
        <span className="flex items-center gap-1.5">📄 {ui.docTitle}</span>
        <span className="text-xs text-slate-600 font-bold">{approved}/{docs.length} {ui.docApproved}</span>
      </h3>
      {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
      {docs.length === 0 && <p className="text-xs text-muted-foreground font-medium">{ui.docEmpty}</p>}

      {docs.map((d) => (
        <div key={d.id} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              {typeName(d.doc_type)} <DemoBadge show={d.is_demo} />
            </span>
            <span className="flex items-center gap-2">
              {d.file_url && <button type="button" onClick={async () => {
                const url = await openCandidateDocument(d.id, d.file_url);
                if (url) window.open(url, '_blank', 'noopener,noreferrer');
              }} className="text-xs font-bold text-blue-600 underline hover:text-blue-800">{ui.docOpen}</button>}
              <DeleteRecordButton table="candidate_documents" id={d.id} name={typeName(d.doc_type)} isDemo={d.is_demo} allowed={upper} onDeleted={load} />
            </span>
          </div>

          <select
            value={d.status}
            onChange={(e) => update(d, { status: e.target.value }, statusName(e.target.value))}
            className="w-full text-xs font-bold border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-900 outline-none cursor-pointer"
          >
            {STATUS_KEYS.map((key) => <option key={key} value={key}>{ui.docStatuses[key]}</option>)}
          </select>

          <label className="block text-[11px] font-bold text-slate-700">
            {releaseCopy[currentLang].docReason}
            <input
              defaultValue={d.review_note || ''}
              onBlur={(e) => e.target.value !== (d.review_note || '') && update(d, { review_note: e.target.value }, e.target.value)}
              className="mt-1 w-full border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold bg-white text-slate-900 outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700 font-bold pt-0.5">
            {ui.docValidUntil}
            <input type="date" defaultValue={d.valid_until || ''} onBlur={(e) => e.target.value !== (d.valid_until || '') && update(d, { valid_until: e.target.value || null }, `${ui.docValidUntil} ${e.target.value}`)} className="border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold bg-white text-slate-900 outline-none" />
          </label>
        </div>
      ))}

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <select value={newType} onChange={(e) => setNewType(e.target.value)} className="flex-1 text-xs font-bold border border-slate-300 rounded-xl px-3 py-2.5 bg-white text-slate-900 outline-none cursor-pointer">
          {DOC_TYPE_KEYS.map((key) => <option key={key} value={key}>{ui.docTypes[key]}</option>)}
        </select>
        <button onClick={add} className="text-xs font-bold px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow">
          {ui.docRequest}
        </button>
      </div>
    </div>
  );
}
