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
        <a className="hover:underline" href={`mailto:${company.email}`}>{company.email}</a>
        {' · '}
        <a className="hover:underline" href={`tel:${company.phones[0].tel}`}>{company.phones[0].name} {company.phones[0].display}</a>
        {' · '}
        <a className="hover:underline" href={`tel:${company.phones[1].tel}`}>{company.phones[1].name} {company.phones[1].display}</a>
      </p>
    </footer>
  );
}
