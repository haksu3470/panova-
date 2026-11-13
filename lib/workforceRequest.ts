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

/** Limits shared with the job_requests check rules (20261113180000_job_requests_guards.sql). */
export const HEADCOUNT_MIN = 1;
export const HEADCOUNT_MAX = 500;
export const SALARY_MAX = 100000;
export const EXPERIENCE_MAX_YEARS = 60;

/** Form fields, in the order they appear (the first invalid one gets focus). */
export const DEMAND_FIELDS = [
  'sector', 'position', 'experience', 'language', 'headcount', 'city', 'salary', 'duration', 'lodging', 'meals',
] as const;
export type DemandField = (typeof DEMAND_FIELDS)[number];

/** What is wrong with a field; each maps to one message. */
export type DemandFieldError =
  | 'required'
  | 'headcount_range'
  | 'salary_number'
  | 'salary_range'
  | 'experience_range';

export type DemandFieldErrors = Partial<Record<DemandField, DemandFieldError>>;

export type DemandFormInput = {
  sector: string;
  positionTitle: string;
  experience: string;
  language: string;
  /** As typed: must be a whole number from 1 to 500. */
  headcountText: string;
  city: string;
  salaryText: string;
  duration: string;
  lodging: YesNo;
  meals: YesNo;
};

/** Every problem in the form at once, per field (empty object when valid). */
export function validateDemandForm(input: DemandFormInput): DemandFieldErrors {
  const errors: DemandFieldErrors = {};
  const blank = (value: string) => !String(value ?? '').trim();

  if (blank(input.sector)) errors.sector = 'required';
  if (blank(input.positionTitle)) errors.position = 'required';

  if (blank(input.experience)) errors.experience = 'required';
  else if (!(input.experience in EXPERIENCE_YEARS)) errors.experience = 'experience_range';
  else {
    const years = experienceYearsFromChoice(input.experience);
    if (years < 0 || years > EXPERIENCE_MAX_YEARS) errors.experience = 'experience_range';
  }

  if (blank(input.language)) errors.language = 'required';

  const headcount = String(input.headcountText ?? '').trim();
  if (!headcount) errors.headcount = 'required';
  else if (!/^\d+$/.test(headcount) || Number(headcount) < HEADCOUNT_MIN || Number(headcount) > HEADCOUNT_MAX) {
    errors.headcount = 'headcount_range';
  }

  if (blank(input.city)) errors.city = 'required';

  if (blank(input.salaryText)) errors.salary = 'required';
  else {
    const salary = parseMonthlyNetSalary(input.salaryText);
    if (salary == null) errors.salary = /\d/.test(input.salaryText) ? 'salary_range' : 'salary_number';
    else if (salary > SALARY_MAX) errors.salary = 'salary_range';
  }

  if (blank(input.duration)) errors.duration = 'required';
  if (input.lodging !== 'yes' && input.lodging !== 'no') errors.lodging = 'required';
  if (input.meals !== 'yes' && input.meals !== 'no') errors.meals = 'required';
  return errors;
}

/** The first invalid field in form order, or null. */
export function firstInvalidDemandField(errors: DemandFieldErrors): DemandField | null {
  return DEMAND_FIELDS.find((field) => errors[field]) ?? null;
}

/** job_requests check rules and the form field each one belongs to. */
export const JOB_REQUEST_RULES: Record<string, { field: DemandField | 'company'; error: DemandFieldError }> = {
  job_requests_headcount_range: { field: 'headcount', error: 'headcount_range' },
  job_requests_position_title_nonblank: { field: 'position', error: 'required' },
  job_requests_employer_name_nonblank: { field: 'company', error: 'required' },
  job_requests_sector_nonblank: { field: 'sector', error: 'required' },
  job_requests_salary_range: { field: 'salary', error: 'salary_range' },
  job_requests_experience_range: { field: 'experience', error: 'experience_range' },
  job_requests_city_nonblank: { field: 'city', error: 'required' },
  job_requests_contract_type_nonblank: { field: 'duration', error: 'required' },
};

/**
 * A rule refusal from the database (23514 check_violation naming one of the
 * job_requests_* rules), as the form field it belongs to. 'company' is the
 * company name from the employer profile, not a form field. Null for any
 * other error.
 */
export function demandRuleFromDbError(
  error: unknown,
): { field: DemandField | 'company'; error: DemandFieldError; rule: string } | null {
  if (!error || typeof error !== 'object') return null;
  const e = error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown };
  const text = [e.message, e.details, e.hint].map((v) => String(v ?? '')).join(' ');
  if (e.code !== '23514' && !/check_violation|violates check constraint/i.test(text)) return null;
  const rule = Object.keys(JOB_REQUEST_RULES).find((name) => text.includes(name));
  return rule ? { ...JOB_REQUEST_RULES[rule], rule } : null;
}

type DemandCopyKey =
  | 'demandErrRequired' | 'demandErrSector' | 'demandErrPosition' | 'demandErrHeadcount' | 'demandErrCity'
  | 'demandErrDuration' | 'demandErrSalaryRange' | 'demandErrExperience' | 'demandErrCompanyName'
  | 'salaryAmountRequired' | 'lodgingRequired' | 'mealsRequired';

/** The message shown under a field (dictionary keys above). */
export function demandFieldMessage(
  field: DemandField | 'company',
  error: DemandFieldError,
  t: Partial<Record<DemandCopyKey, string>>,
): string {
  const key: DemandCopyKey = (() => {
    switch (field) {
      case 'sector': return 'demandErrSector';
      case 'position': return 'demandErrPosition';
      case 'headcount': return 'demandErrHeadcount';
      case 'city': return 'demandErrCity';
      case 'duration': return 'demandErrDuration';
      case 'company': return 'demandErrCompanyName';
      case 'lodging': return 'lodgingRequired';
      case 'meals': return 'mealsRequired';
      case 'salary': return error === 'salary_range' ? 'demandErrSalaryRange' : 'salaryAmountRequired';
      case 'experience': return error === 'experience_range' ? 'demandErrExperience' : 'demandErrRequired';
      default: return 'demandErrRequired';
    }
  })();
  return t[key] || t.demandErrRequired || '';
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
