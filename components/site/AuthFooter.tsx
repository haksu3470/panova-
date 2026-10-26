import { company } from '@/lib/company';

export function AuthFooter({ tone = 'light' }: { tone?: 'light' | 'slate' | 'dark' }) {
  const cls =
    tone === 'dark'
      ? 'bg-slate-800 text-slate-400 py-6 text-center text-xs border-t border-slate-700'
      : tone === 'slate'
        ? 'bg-slate-50 text-slate-500 py-6 text-center text-xs border-t border-slate-200'
        : 'w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white';

  return (
    <footer className={cls}>
      <p className="font-semibold">{company.shortName}</p>
      <p className="mt-1">{company.address}</p>
      <p className="mt-1">
        {company.phones.map((p, i) => (
          <span key={p.tel}>
            {i > 0 ? ' · ' : null}
            <a className="hover:underline" href={`tel:${p.tel}`}>{p.display}</a>
          </span>
        ))}
      </p>
    </footer>
  );
}
