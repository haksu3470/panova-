import type { ReactNode } from 'react';

export const REQUEST_STATUS: Record<string, string> = {
  new_request: '🟡 Yeni talep',
  reviewing: '🔵 İnceleniyor',
  searching_candidates: '🌍 Aday aranıyor',
  presenting_candidates: '📤 Aday sunuluyor',
  interviews: '🤝 Görüşmeler',
  selection_completed: '⭐ Seçim tamamlandı',
  official_process: '📋 Resmî süreç',
  travel_planning: '✈️ Seyahat planı',
  completed: '🟢 Tamamlandı',
  cancelled: '🔴 İptal',
};

export const RESULT_LABEL: Record<string, string> = {
  interview: '🤝 Görüşmeye çağrıldı',
  selected: '⭐ Seçildi',
  backup: '🔁 Yedek',
  later: '⏳ Daha sonra',
  not_suitable: '❌ Uygun değil',
};

export function Card({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6 space-y-3">
      <div className="flex items-center justify-between gap-2 border-b pb-2">
        <h2 className="text-sm sm:text-base font-extrabold text-slate-900">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border p-3 sm:p-4 shadow-sm">
      <div className="text-[10px] sm:text-xs font-bold uppercase text-slate-500">{label}</div>
      <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
    </div>
  );
}

export function Field({ label, value, onChange, type = 'text', textarea }: { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  const cls = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';
  return (
    <label className="block text-xs font-bold text-slate-600 space-y-1">
      <span>{label}</span>
      {textarea ? (
        <textarea className={cls} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cls} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export const fmtDate = (s?: string | null) => (s ? String(s).substring(0, 10) : '—');
