'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { translations, type Language } from '@/lib/dictionary';
import { portalUi } from '@/lib/portal-ui-copy';
import { auditActionText, auditEntityLabel } from '@/lib/auditDisplay';
import ListExportBar from './ListExportBar';

const copy: Record<Language, { from: string; to: string; load: string; loading: string; ready: string; hint: string; entity: string; failed: string }> = {
  tr: { from: 'Başlangıç', to: 'Bitiş', load: 'Kayıtları hazırla', loading: 'Hazırlanıyor…', ready: '{n} kayıt hazır', hint: 'Tarih seçmezseniz tüm kayıtlar alınır.', entity: 'Kayıt türü', failed: 'Kayıtlar alınamadı.' },
  en: { from: 'From', to: 'To', load: 'Prepare records', loading: 'Preparing…', ready: '{n} records ready', hint: 'Leave the dates empty to take every record.', entity: 'Record type', failed: 'The records could not be loaded.' },
  sq: { from: 'Nga', to: 'Deri', load: 'Përgatit regjistrimet', loading: 'Po përgatitet…', ready: '{n} regjistrime gati', hint: 'Pa data merren të gjitha regjistrimet.', entity: 'Lloji i regjistrimit', failed: 'Regjistrimet nuk u morën.' },
  ar: { from: 'من', to: 'إلى', load: 'تجهيز السجلات', loading: 'جارٍ التجهيز…', ready: '{n} سجل جاهز', hint: 'اترك التاريخين فارغين لأخذ كل السجلات.', entity: 'نوع السجل', failed: 'تعذّر جلب السجلات.' },
  mk: { from: 'Од', to: 'До', load: 'Подготви записи', loading: 'Се подготвува…', ready: '{n} записи подготвени', hint: 'Без датуми се земаат сите записи.', entity: 'Вид запис', failed: 'Записите не може да се вчитаат.' },
};

const PAGE = 1000;

/**
 * Audit log export (CSV / Excel / Print, Panova letterhead via ListExportBar):
 * every record, or only those between two dates (both days included). The
 * tab itself still shows the latest 200; this reads all pages.
 */
export default function AuditExport({ lang, dir }: { lang: Language; dir: 'ltr' | 'rtl' }) {
  const t = translations[lang] || translations.tr;
  const ui = portalUi[lang];
  const c = copy[lang] || copy.en;
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState<Record<string, unknown>[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setBusy(true); setError(''); setRows(null);
    const all: { action: string; actor_name: string | null; entity_type: string | null; created_at: string; is_demo: boolean | null }[] = [];
    for (let start = 0; ; start += PAGE) {
      let q = supabase.from('audit_logs').select('action, actor_name, entity_type, created_at, is_demo').order('created_at', { ascending: false });
      // Local calendar days: from 00:00 of the first day to the end of the last.
      if (from) q = q.gte('created_at', new Date(`${from}T00:00:00`).toISOString());
      if (to) q = q.lt('created_at', new Date(new Date(`${to}T00:00:00`).getTime() + 86400000).toISOString());
      const { data, error: loadError } = await q.range(start, start + PAGE - 1);
      if (loadError) {
        setError(`${c.failed} ${loadError.message}`);
        setBusy(false);
        return;
      }
      all.push(...(data || []));
      if (!data || data.length < PAGE) break;
    }
    setRows(all.map((a) => ({
      [t.colAction]: auditActionText(a.action, a.entity_type, lang),
      [t.colPerformer]: a.actor_name || '—',
      [c.entity]: auditEntityLabel(a.entity_type, lang) + (a.is_demo ? ' (demo)' : ''),
      [t.colTime]: new Date(a.created_at).toLocaleString(lang === 'tr' ? 'tr-TR' : undefined, { timeZone: 'Europe/Istanbul' }),
    })));
    setBusy(false);
  };

  const inp = 'px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 scheme-light';
  return (
    <div className="p-3 rounded-xl border bg-slate-50 space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[11px] font-bold text-slate-700">{c.from}
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setRows(null); }} className={`${inp} block mt-1`} />
        </label>
        <label className="text-[11px] font-bold text-slate-700">{c.to}
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setRows(null); }} className={`${inp} block mt-1`} />
        </label>
        <button type="button" onClick={load} disabled={busy} className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:bg-disabled disabled:text-on-dark disabled:opacity-100">
          {busy ? c.loading : c.load}
        </button>
        {rows ? <span className="text-xs font-bold text-emerald-800">{c.ready.replace('{n}', String(rows.length))}</span> : null}
      </div>
      <p className="text-[11px] text-muted-foreground">{c.hint}</p>
      {error ? <p role="alert" className="text-xs font-bold text-red-700">{error}</p> : null}
      {rows ? (
        <ListExportBar
          filename="islem-gecmisi"
          title={t.auditLogTitle}
          rows={rows}
          lang={lang}
          dir={dir}
          labels={{ csv: ui.exportCsv, excel: ui.exportExcel, print: ui.exportPrint, empty: ui.exportEmpty, popupBlocked: ui.exportPopupBlocked }}
        />
      ) : null}
    </div>
  );
}
