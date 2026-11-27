/**
 * Sortable table headings (standing rule): first click sorts ascending, the
 * second descending, and so on. Text compares in the page language with
 * numbers in order (2 < 10); empty values always go last. Stable, so equal
 * rows keep the order they came in.
 */
export type SortDir = 'asc' | 'desc';
export type SortState<K extends string> = { key: K; dir: SortDir } | null;

export function nextSort<K extends string>(current: SortState<K>, key: K): SortState<K> {
  return current?.key === key && current.dir === 'asc' ? { key, dir: 'desc' } : { key, dir: 'asc' };
}

export type SortValue = string | number | boolean | null | undefined;

export function sortRows<T, K extends string>(
  rows: readonly T[],
  state: SortState<K>,
  value: (row: T, key: K) => SortValue,
  locale?: string,
): T[] {
  if (!state) return [...rows];
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });
  const sign = state.dir === 'asc' ? 1 : -1;
  const empty = (v: SortValue) => v == null || v === '';
  return rows
    .map((row, index) => ({ row, index, v: value(row, state.key) }))
    .sort((a, b) => {
      if (empty(a.v) || empty(b.v)) return empty(a.v) === empty(b.v) ? a.index - b.index : empty(a.v) ? 1 : -1;
      const diff = typeof a.v === 'number' && typeof b.v === 'number'
        ? a.v - b.v
        : collator.compare(String(a.v), String(b.v));
      return diff * sign || a.index - b.index;
    })
    .map((entry) => entry.row);
}
