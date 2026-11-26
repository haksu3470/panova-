import type { Language } from './dictionary';

/**
 * Benefits an offer or a request can include. Offers keep the chosen keys in
 * job_offers.offer_terms.benefits; requests keep the first four in their own
 * boolean columns and the rest in job_requests.extra_benefits
 * (check rules: migration 20261126140000).
 */
export const BENEFIT_KEYS = [
  'accommodation',
  'meals',
  'transport',
  'flight_out',
  'flight_return',
  'permit_fees',
  'health_insurance',
  'overtime_paid',
  'work_gear',
] as const;
export type BenefitKey = (typeof BENEFIT_KEYS)[number];

/** Request columns that already existed before extra_benefits. */
export const REQUEST_BENEFIT_COLUMNS = {
  accommodation: 'accommodation_provided',
  meals: 'food_provided',
  transport: 'transport_provided',
  flight_out: 'flight_covered',
} as const satisfies Partial<Record<BenefitKey, string>>;

export const EXTRA_BENEFIT_KEYS = ['flight_return', 'permit_fees', 'health_insurance', 'overtime_paid', 'work_gear'] as const;
export type ExtraBenefitKey = (typeof EXTRA_BENEFIT_KEYS)[number];

const isBenefit = (v: unknown): v is BenefitKey => (BENEFIT_KEYS as readonly string[]).includes(String(v));

/** Known keys only, in list order, no repeats. */
export function cleanBenefits(values: unknown): BenefitKey[] {
  const set = new Set(Array.isArray(values) ? values.filter(isBenefit) : []);
  return BENEFIT_KEYS.filter((k) => set.has(k));
}

type RequestLike = Partial<Record<(typeof REQUEST_BENEFIT_COLUMNS)[keyof typeof REQUEST_BENEFIT_COLUMNS], unknown>> & {
  extra_benefits?: unknown;
};

/** Benefits a request provides (true columns + extra_benefits). */
export function requestBenefits(request: RequestLike | null | undefined): BenefitKey[] {
  if (!request) return [];
  const fromColumns = Object.entries(REQUEST_BENEFIT_COLUMNS)
    .filter(([, col]) => request[col] === true)
    .map(([key]) => key);
  return cleanBenefits([...fromColumns, ...(Array.isArray(request.extra_benefits) ? request.extra_benefits : [])]);
}

/** Request columns for the optional benefits (accommodation and meals stay their own yes/no questions). */
export function requestOptionalBenefitColumns(keys: readonly string[]) {
  const set = new Set(cleanBenefits(keys));
  return {
    transport_provided: set.has('transport'),
    flight_covered: set.has('flight_out'),
    extra_benefits: EXTRA_BENEFIT_KEYS.filter((k) => set.has(k)),
  };
}

/** Benefits stored on an offer. */
export function offerBenefits(offer: { offer_terms?: unknown } | null | undefined): BenefitKey[] {
  const terms = offer?.offer_terms;
  return terms && typeof terms === 'object' ? cleanBenefits((terms as { benefits?: unknown }).benefits) : [];
}

export const benefitLabels: Record<Language, Record<BenefitKey, string> & { title: string; optionalTitle: string }> = {
  tr: {
    title: 'Sağlanan imkânlar',
    optionalTitle: 'Diğer imkânlar (varsa işaretleyin)',
    accommodation: 'Konaklama',
    meals: 'Yemek',
    transport: 'İşe ulaşım (servis)',
    flight_out: 'Gidiş uçak bileti',
    flight_return: 'Dönüş uçak bileti (sözleşme sonunda)',
    permit_fees: 'Çalışma izni / vize masrafları işverende',
    health_insurance: 'Sağlık sigortası (yasal zorunluluğun üstünde)',
    overtime_paid: 'Fazla mesai ücreti ödenir',
    work_gear: 'İş kıyafeti ve ekipman',
  },
  en: {
    title: 'Benefits provided',
    optionalTitle: 'Other benefits (tick if provided)',
    accommodation: 'Accommodation',
    meals: 'Meals',
    transport: 'Transport to work',
    flight_out: 'Outbound flight ticket',
    flight_return: 'Return flight ticket (end of contract)',
    permit_fees: 'Work permit / visa fees paid by employer',
    health_insurance: 'Health insurance (beyond the legal minimum)',
    overtime_paid: 'Overtime is paid',
    work_gear: 'Work clothing and equipment',
  },
  sq: {
    title: 'Përfitimet e ofruara',
    optionalTitle: 'Përfitime të tjera (shënoni nëse ofrohen)',
    accommodation: 'Akomodimi',
    meals: 'Ushqimi',
    transport: 'Transporti për në punë',
    flight_out: 'Bileta e avionit për ardhje',
    flight_return: 'Bileta e avionit për kthim (në fund të kontratës)',
    permit_fees: 'Tarifat e lejes së punës / vizës i paguan punëdhënësi',
    health_insurance: 'Sigurim shëndetësor (përtej minimumit ligjor)',
    overtime_paid: 'Orët shtesë paguhen',
    work_gear: 'Veshje dhe pajisje pune',
  },
  ar: {
    title: 'المزايا المقدمة',
    optionalTitle: 'مزايا أخرى (ضع علامة إن وُجدت)',
    accommodation: 'السكن',
    meals: 'الوجبات',
    transport: 'المواصلات إلى العمل',
    flight_out: 'تذكرة طيران للقدوم',
    flight_return: 'تذكرة طيران للعودة (نهاية العقد)',
    permit_fees: 'رسوم تصريح العمل / التأشيرة على صاحب العمل',
    health_insurance: 'تأمين صحي (فوق الحد القانوني)',
    overtime_paid: 'العمل الإضافي مدفوع',
    work_gear: 'ملابس ومعدات العمل',
  },
  mk: {
    title: 'Обезбедени поволности',
    optionalTitle: 'Други поволности (означете ако се обезбедени)',
    accommodation: 'Сместување',
    meals: 'Храна',
    transport: 'Превоз до работа',
    flight_out: 'Авионски билет за доаѓање',
    flight_return: 'Авионски билет за враќање (на крај на договорот)',
    permit_fees: 'Трошоците за работна дозвола / виза ги плаќа работодавачот',
    health_insurance: 'Здравствено осигурување (над законскиот минимум)',
    overtime_paid: 'Прекувремената работа се плаќа',
    work_gear: 'Работна облека и опрема',
  },
};

/** "Accommodation · Meals" in the page language; '' when none. */
export function benefitsText(keys: readonly BenefitKey[], lang: Language): string {
  const l = benefitLabels[lang] || benefitLabels.en;
  return keys.map((k) => l[k]).join(' · ');
}
