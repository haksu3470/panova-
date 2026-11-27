'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { SortState } from '@/lib/tableSort';

/** A table heading that sorts its column (lib/tableSort.ts): first click ascending, second descending. */
export default function SortableTh<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  className = 'p-4 font-bold',
}: {
  label: string;
  sortKey: K;
  sort: SortState<K>;
  onSort: (key: K) => void;
  className?: string;
}) {
  const active = sort?.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 font-bold text-start cursor-pointer hover:underline">
        {label}
        <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? '' : 'opacity-50'}`} aria-hidden="true" />
      </button>
    </th>
  );
}
