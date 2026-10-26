import { company, presenceLabel } from '@/lib/company';

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
      <p className="mt-1">{presenceLabel()}</p>
      <p className="mt-1">{company.address}</p>
      <p className="mt-1">
        <a className="hover:underline" href={`mailto:${company.email}`}>{company.email}</a>
      </p>
      <p className="mt-1">
        {company.phones.map((p, i) => (
          <span key={p.tel}>
            {i > 0 ? ' · ' : null}
            <a className="hover:underline" href={`tel:${p.tel}`}>{p.display}</a>
          </span>
        ))}
      </p>
      <p className="mt-2">{company.turkey.addressLines.join(' · ')}</p>
      <p className="mt-1">
        <a className="hover:underline" href={`mailto:${company.turkey.email}`}>{company.turkey.email}</a>
        {' · '}
        <a className="hover:underline" href={`tel:${company.turkey.phone.tel}`}>{company.turkey.phone.display}</a>
      </p>
      <p className="mt-2">{company.bangladesh.addressLines.join(' · ')}</p>
      <p className="mt-1">
        <a className="hover:underline" href={`mailto:${company.bangladesh.email}`}>{company.bangladesh.email}</a>
        {' · '}
        <a className="hover:underline" href={`tel:${company.bangladesh.phone.tel}`}>{company.bangladesh.phone.display}</a>
      </p>
    </footer>
  );
}
