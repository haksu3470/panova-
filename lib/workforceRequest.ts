export type YesNo = '' | 'yes' | 'no';

export type DemandBlock = 'position' | 'lodging' | 'meals' | 'both' | 'salary';

export type EmployerDemandDraft = {
  employerId: string;
  employerName: string;
  country: string;
  positionTitle: string;
  sector: string;
  headcount: number;
  city: string;
  salaryText: string;
  duration: string;
  experience: string;
  language: string;
  lodging: YesNo;
  meals: YesNo;
};

export type EmployerDemandRow = {
  employer_id: string;
  employer_name: string;
  position_title: string;
  sector: string;
  headcount: number;
  city: string;
  country: string | null;
  monthly_net_salary: number;
  contract_type: string;
  required_experience_years: number;
  required_language: string;
  accommodation_provided: boolean;
  food_provided: boolean;
  status: 'new_request';
};

const EXPERIENCE_YEARS: Record<string, number> = {
  none: 0,
  '1-3': 1,
  '3-5': 3,
  '5+': 5,
};

export function experienceYearsFromChoice(value: string): number {
  return EXPERIENCE_YEARS[value] ?? 0;
}

export function yesNoToBoolean(value: YesNo): boolean | null {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return null;
}

/** True and false are answers. Null, empty, and anything else are unanswered. */
export function benefitsAnswered(lodging: unknown, meals: unknown): 'lodging' | 'meals' | 'both' | null {
  const lodgingOk = lodging === true || lodging === false;
  const mealsOk = meals === true || meals === false;
  if (!lodgingOk && !mealsOk) return 'both';
  if (!lodgingOk) return 'lodging';
  if (!mealsOk) return 'meals';
  return null;
}

/**
 * Reads a monthly net amount from free text such as "1200 EUR" or "1.200,50".
 * A single group of three digits after a separator is treated as thousands.
 */
export function parseMonthlyNetSalary(input: string): number | null {
  const digits = input.trim().replace(/[^\d.,]/g, '');
  if (!/\d/.test(digits)) return null;

  const lastComma = digits.lastIndexOf(',');
  const lastDot = digits.lastIndexOf('.');
  let normalized: string;

  if (lastComma !== -1 && lastDot !== -1) {
    const decimalIsComma = lastComma > lastDot;
    normalized = decimalIsComma
      ? digits.replace(/\./g, '').replace(',', '.')
      : digits.replace(/,/g, '');
  } else if (lastComma === -1 && lastDot === -1) {
    normalized = digits;
  } else {
    const separator = lastComma !== -1 ? ',' : '.';
    const parts = digits.split(separator);
    const thousands = parts.length > 1 && parts.slice(1).every((part) => part.length === 3);
    normalized = thousands ? parts.join('') : digits.replace(separator, '.');
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function buildEmployerDemandInsert(
  draft: EmployerDemandDraft,
): { ok: true; row: EmployerDemandRow } | { ok: false; error: DemandBlock } {
  if (!draft.positionTitle.trim()) return { ok: false, error: 'position' };
  const lodging = yesNoToBoolean(draft.lodging);
  const meals = yesNoToBoolean(draft.meals);
  const benefit = benefitsAnswered(lodging, meals);
  if (benefit) return { ok: false, error: benefit };
  const salary = parseMonthlyNetSalary(draft.salaryText);
  if (salary == null) return { ok: false, error: 'salary' };
  if (lodging == null || meals == null) return { ok: false, error: 'both' };

  const headcount = Number.isFinite(draft.headcount) && draft.headcount >= 1
    ? Math.trunc(draft.headcount)
    : 1;

  return {
    ok: true,
    row: {
      employer_id: draft.employerId,
      employer_name: draft.employerName.trim(),
      position_title: draft.positionTitle.trim(),
      sector: draft.sector,
      headcount,
      city: draft.city.trim(),
      country: draft.country.trim() || null,
      monthly_net_salary: salary,
      contract_type: draft.duration.trim(),
      required_experience_years: experienceYearsFromChoice(draft.experience),
      required_language: draft.language.trim(),
      accommodation_provided: lodging,
      food_provided: meals,
      status: 'new_request',
    },
  };
}

export function benefitPhrase(
  labels: { provided: string; notProvided: string; unanswered: string },
  value: unknown,
): string {
  if (value === true) return labels.provided;
  if (value === false) return labels.notProvided;
  return labels.unanswered;
}

export function displayedRequestSalary(row: {
  salary?: string | null;
  monthly_net_salary?: number | string | null;
}): string {
  const text = typeof row.salary === 'string' ? row.salary.trim() : '';
  if (text) return text;
  if (row.monthly_net_salary != null && String(row.monthly_net_salary).trim() !== '') {
    return String(row.monthly_net_salary);
  }
  return '';
}
