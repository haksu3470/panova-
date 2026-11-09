'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import { fill, portalUi } from '@/lib/portal-ui-copy';
import { useSiteLanguage } from '@/lib/site-language';

const TABLES = ['job_candidates', 'employers', 'job_requests', 'candidate_documents'] as const;
type Deletable = (typeof TABLES)[number];

export default function DeleteRecordButton({
  table,
  id,
  name,
  isDemo,
  allowed,
  onDeleted,
}: {
  table: Deletable;
  id: string;
  name: string;
  isDemo?: boolean | null;
  allowed: boolean;
  onDeleted?: () => void;
}) {
  const { currentLang } = useSiteLanguage('tr');
  const ui = portalUi[currentLang];
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!allowed || !id) return null;

  const remove = async () => {
    setBusy(true);
    setError('');
    const { data, error: deleteError } = await supabase.from(table).delete().eq('id', id).select('id');
    setBusy(false);
    if (deleteError || !data?.length) {
      setError(deleteError?.message ? `${ui.deleteFailed} ${deleteError.message}` : ui.deleteFailed);
      return;
    }
    await writeAudit(`${ui.deleted}: ${name}`, table, id, { is_demo: !!isDemo });
    setOpen(false);
    onDeleted?.();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setError(''); setOpen(true); }}
        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer"
      >
        {ui.deleteRecord}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl border shadow-xl max-w-md w-full p-5 space-y-3" role="dialog" aria-modal="true">
            <h2 className="text-base font-extrabold">{ui.deleteConfirmTitle}</h2>
            <p className="text-sm">{fill(ui.deleteConfirmBody, { name: name || id })}</p>
            {isDemo ? <p className="text-xs font-bold text-amber-800">{ui.deleteDemoNote}</p> : null}
            {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="px-3 py-2 rounded-xl border text-xs font-bold text-slate-800 bg-white">{ui.cancelAction}</button>
              <button type="button" onClick={remove} disabled={busy} className="px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold disabled:opacity-50">{ui.deleteRecord}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
