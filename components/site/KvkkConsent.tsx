import Link from 'next/link';
import type { ReleaseCopy } from '@/lib/release-copy';

export default function KvkkConsent({
  id,
  checked,
  onChange,
  copy,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  copy: ReleaseCopy;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-2 text-xs leading-snug text-slate-700">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        required
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#2e7d32]"
      />
      <span>
        {copy.kvkkBefore}{' '}
        <Link href="/kvkk" className="font-bold text-emerald-800 underline" target="_blank">
          {copy.kvkkLink}
        </Link>
        {copy.kvkkAfter}
      </span>
    </label>
  );
}
