/**
 * Salary amounts with their currency, the same way on every screen.
 *
 * Requests store the currency in job_requests.salary_currency (EUR or USD,
 * default EUR; supabase/migrations/20261113190000_job_requests_salary_currency.sql).
 * Offers keep it in job_offers.offer_terms.currency, copied from the request.
 * Pure functions only.
 */

/** Currencies a request can use. */
export const SALARY_CURRENCIES = ['EUR', 'USD'] as const;
export type SalaryCurrency = (typeof SALARY_CURRENCIES)[number];
export const DEFAULT_SALARY_CURRENCY: SalaryCurrency = 'EUR';

/** The symbol shown next to the salary field (€ / $). */
export const SALARY_CURRENCY_SYMBOL: Record<SalaryCurrency, string> = { EUR: '€', USD: '$' };

/** EUR or USD from a stored value; anything else (or nothing) is EUR. */
export function salaryCurrency(value: unknown): SalaryCurrency {
  const code = String(value ?? '').trim().toUpperCase();
  return (SALARY_CURRENCIES as readonly string[]).includes(code) ? (code as SalaryCurrency) : DEFAULT_SALARY_CURRENCY;
}

/** A request's currency (job_requests.salary_currency), EUR when missing. */
export function requestCurrency(request: { salary_currency?: unknown } | null | undefined): SalaryCurrency {
  return salaryCurrency(request?.salary_currency);
}

/** A finite number from a stored amount (number or numeric text), else null. */
export function salaryAmount(value: unknown): number | null {
  if (value == null) return null;
  const text = String(value).trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

/**
 * "1.400 €" / "€1.400" / "$1,400", by the page locale (for example 'tr-TR',
 * 'en-GB'). Whole amounts show no decimals. Empty when there is no amount.
 * Any ISO code works (older offers may hold other codes); an unknown code
 * falls back to "1400 XYZ".
 */
export function formatSalary(amount: unknown, currency: unknown, locale: string): string {
  const value = salaryAmount(amount);
  if (value === null) return '';
  const code = String(currency ?? '').trim().toUpperCase() || DEFAULT_SALARY_CURRENCY;
  const fraction = Number.isInteger(value) ? 0 : 2;
  try {
    return new Intl.NumberFormat(locale || 'en-GB', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    }).format(value);
  } catch {
    return `${value} ${code}`;
  }
}

/**
 * Salary field as typed on the request form: digits with optional thousands
 * or decimal separators only ("1400", "1.400", "1 400", "1400,50"). Letters,
 * currency words or signs are refused (null). The number must be > 0.
 */
export function parseSalaryInput(input: string): number | null {
  const text = String(input ?? '').trim();
  if (!text || !/^\d[\d\s.,]*$/.test(text)) return null;
  const digits = text.replace(/\s/g, '');
  const lastComma = digits.lastIndexOf(',');
  const lastDot = digits.lastIndexOf('.');
  let normalized: string;
  if (lastComma !== -1 && lastDot !== -1) {
    normalized = lastComma > lastDot ? digits.replace(/\./g, '').replace(',', '.') : digits.replace(/,/g, '');
  } else if (lastComma === -1 && lastDot === -1) {
    normalized = digits;
  } else {
    const separator = lastComma !== -1 ? ',' : '.';
    const parts = digits.split(separator);
    const thousands = parts.length > 1 && parts.slice(1).every((part) => part.length === 3);
    normalized = thousands ? parts.join('') : parts.length === 2 ? `${parts[0]}.${parts[1]}` : '';
  }
  const value = Number(normalized);
  return normalized && Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Starting values for a new offer: salary and currency from the request
 * (the salary may then be changed, the currency may not). Without a request
 * the currency is EUR. An existing offer keeps its own salary; its currency
 * follows the request when there is one, else what the offer stored.
 */
export function offerDefaultsFromRequest(
  request: { monthly_net_salary?: unknown; salary_currency?: unknown } | null | undefined,
  existing?: { monthly_net_salary?: unknown; offer_terms?: { currency?: unknown } | null } | null,
): { monthly_net_salary: string; currency: string } {
  const stored = String(existing?.offer_terms?.currency ?? '').trim().toUpperCase();
  const currency = request ? requestCurrency(request) : stored || DEFAULT_SALARY_CURRENCY;
  const amount = existing ? salaryAmount(existing.monthly_net_salary) : salaryAmount(request?.monthly_net_salary);
  return { monthly_net_salary: amount === null ? '' : String(amount), currency };
}
