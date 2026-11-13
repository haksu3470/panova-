/**
 * Work duration of a request, stored in job_requests.contract_type as text.
 *
 * Canonical form (fixed Turkish unit codes, whatever the page language):
 *   "<1-999> gün" | "<1-999> hafta" | "<1-999> ay" | "<1-999> yıl" | "süresiz"
 * Anything else is an older free-text value and is shown as typed.
 */

export const DURATION_UNITS = ['gün', 'hafta', 'ay', 'yıl'] as const;
export type DurationUnit = (typeof DURATION_UNITS)[number];
export const OPEN_ENDED_DURATION = 'süresiz';
export const DURATION_AMOUNT_MIN = 1;
export const DURATION_AMOUNT_MAX = 999;

/** Value of the unit list in the form: a unit, "open" (no end date) or nothing yet. */
export type DurationUnitChoice = DurationUnit | 'open' | '';

export type ParsedDuration = { kind: 'open' } | { kind: 'fixed'; amount: number; unit: DurationUnit };

export function isDurationUnit(value: string): value is DurationUnit {
  return (DURATION_UNITS as readonly string[]).includes(value);
}

/** The form value as stored text, or null when it is not complete and valid. */
export function canonicalDuration(unit: DurationUnitChoice, amountText: string): string | null {
  if (unit === 'open') return OPEN_ENDED_DURATION;
  if (!unit || !isDurationUnit(unit)) return null;
  const amount = parseDurationAmount(amountText);
  return amount == null ? null : `${amount} ${unit}`;
}

/** A whole number from 1 to 999 typed in the amount field, or null. */
export function parseDurationAmount(text: string): number | null {
  const value = String(text ?? '').trim();
  if (!/^\d{1,3}$/.test(value)) return null;
  const amount = Number(value);
  return amount >= DURATION_AMOUNT_MIN && amount <= DURATION_AMOUNT_MAX ? amount : null;
}

/** Reads the canonical form only; free text (e.g. "Sezonluk", "12 months") gives null. */
export function parseContractDuration(text: unknown): ParsedDuration | null {
  if (typeof text !== 'string') return null;
  const value = text.trim();
  if (value === OPEN_ENDED_DURATION) return { kind: 'open' };
  const match = /^(\d{1,3}) (gün|hafta|ay|yıl)$/.exec(value);
  if (!match) return null;
  const amount = Number(match[1]);
  if (amount < DURATION_AMOUNT_MIN || amount > DURATION_AMOUNT_MAX) return null;
  return { kind: 'fixed', amount, unit: match[2] as DurationUnit };
}

/** Dictionary texts the formatter needs. Unit forms are "|"-separated, see pluralForm(). */
export type DurationCopy = {
  durationOpenShort?: string;
  durationDayForms?: string;
  durationWeekForms?: string;
  durationMonthForms?: string;
  durationYearForms?: string;
};

const FORM_KEY: Record<DurationUnit, keyof DurationCopy> = {
  gün: 'durationDayForms',
  hafta: 'durationWeekForms',
  ay: 'durationMonthForms',
  yıl: 'durationYearForms',
};

/**
 * Picks the noun form for n. The dictionary gives 1 form (no plural, e.g.
 * Turkish), 2 forms (one | other) or 5 forms (one | two | few | many | other,
 * Arabic). The category comes from Intl.PluralRules for the language.
 */
export function pluralForm(forms: string, n: number, lang: string): string {
  const list = forms.split('|').map((part) => part.trim());
  if (list.length === 1) return list[0];
  let category: string;
  try {
    category = new Intl.PluralRules(lang).select(n);
  } catch {
    category = n === 1 ? 'one' : 'other';
  }
  const order = list.length >= 5 ? ['one', 'two', 'few', 'many', 'other'] : ['one', 'other'];
  const index = order.indexOf(category);
  return list[index >= 0 ? index : list.length - 1] || list[list.length - 1];
}

/**
 * The duration for display in the page language: canonical values are
 * translated ("12 ay" -> "12 months"), anything else is returned as stored.
 */
export function formatContractDuration(text: unknown, lang: string, copy: DurationCopy): string {
  const raw = typeof text === 'string' ? text.trim() : '';
  const parsed = parseContractDuration(raw);
  if (!parsed) return raw;
  if (parsed.kind === 'open') return copy.durationOpenShort || raw;
  const forms = copy[FORM_KEY[parsed.unit]];
  if (!forms) return raw;
  return `${parsed.amount} ${pluralForm(forms, parsed.amount, lang)}`;
}

/** The form fields for a stored value (used when editing); free text gives an empty picker. */
export function durationChoiceFrom(text: unknown): { unit: DurationUnitChoice; amountText: string } {
  const parsed = parseContractDuration(text);
  if (!parsed) return { unit: '', amountText: '' };
  if (parsed.kind === 'open') return { unit: 'open', amountText: '' };
  return { unit: parsed.unit, amountText: String(parsed.amount) };
}

/** Today as YYYY-MM-DD in the browser's local time (the date input uses local dates). */
export function localIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** A real calendar date in YYYY-MM-DD form. */
export function isIsoDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const [y, m, d] = text.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}
