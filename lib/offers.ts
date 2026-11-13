import { DEFAULT_SALARY_CURRENCY, formatSalary } from './money';

export const OFFER_CURRENCIES = ['EUR', 'USD', 'GBP', 'MKD', 'TRY', 'ALL', 'BAM'] as const;

export type OfferCurrency = (typeof OFFER_CURRENCIES)[number];

export type OfferLike = {
  monthly_net_salary?: number | string | null;
  salary?: number | string | null;
  offer_terms?: { currency?: string | null } | null;
  terms_details?: string | null;
  start_date?: string | null;
  status?: string | null;
  position_title?: string | null;
  employer_name?: string | null;
  country?: string | null;
};

export function offerCurrency(offer: OfferLike): OfferCurrency | '' {
  const raw = offer.offer_terms && typeof offer.offer_terms === 'object'
    ? offer.offer_terms.currency
    : '';
  const code = String(raw || '').trim().toUpperCase();
  return (OFFER_CURRENCIES as readonly string[]).includes(code) ? code as OfferCurrency : '';
}

export function offerAmount(offer: OfferLike): string {
  const raw = offer.monthly_net_salary ?? offer.salary;
  if (raw == null) return '';
  const text = String(raw).trim();
  if (!text) return '';
  const value = Number(text);
  if (!Number.isFinite(value)) return text;
  return String(value);
}

/**
 * Amount with its currency. With a page locale ('tr-TR', 'en-GB', …) it is
 * formatted like every other salary (formatSalary: "€1.400", "$1,400"); an
 * offer with no stored currency is EUR. Without a locale: "1000 EUR" (exports).
 * Empty when the offer has no salary figure.
 */
export function offerMoney(offer: OfferLike, locale?: string): string {
  const amount = offerAmount(offer);
  if (!amount) return '';
  const currency = offerCurrency(offer);
  if (locale) {
    const formatted = formatSalary(amount, currency || DEFAULT_SALARY_CURRENCY, locale);
    if (formatted) return formatted;
  }
  return currency ? `${amount} ${currency}` : amount;
}

export function offerStatusLabel(status: string | null | undefined, labels: Record<string, string>): string {
  const key = (status || '').trim();
  if (!key) return '';
  return labels[key] || key;
}

export function candidateOfferResponse(status: 'accepted' | 'rejected', respondedAt: string) {
  return { status, responded_at: respondedAt };
}

export function offerTermsPayload(currency: string, existing?: OfferLike['offer_terms']) {
  const code = offerCurrency({ offer_terms: { currency } });
  const base = existing && typeof existing === 'object' ? { ...existing } : {};
  if (!code) {
    delete base.currency;
    return Object.keys(base).length ? base : null;
  }
  return { ...base, currency: code };
}
