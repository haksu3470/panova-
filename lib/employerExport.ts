import type { Language } from './dictionary';
import { exportAmount, exportCountry, exportDate } from './exportLists';
import { requestCurrency } from './money';
import { offerAmount, offerCurrency } from './offers';
import { localizeCatalogTitle, professionLabel } from './professions';

/**
 * Employer-portal exports (CSV, Excel, print). Each builder is a whitelist:
 * it copies only the columns listed below, from rows the employer page has
 * already loaded and already shows. Nothing else is read, so an export never
 * shows more than the screen does.
 *
 * Never in an employer row: panova_notes, internal_notes, referral_code,
 * phone, email, passport, document fields, flight number, 30/60/90-day
 * follow-up notes, video links, internal ids.
 */

/** Columns per list, in output order. Tests pin these. */
export const EMPLOYER_EXPORT_COLUMNS = {
  requests: [
    'position_title', 'headcount', 'city', 'country', 'monthly_net_salary', 'currency',
    'contract_type', 'target_start_date', 'status', 'created_at',
  ],
  selected: ['full_name', 'profession', 'nationality', 'city', 'experience_years', 'language_skills', 'position_title', 'decided_at'],
  employees: [
    'full_name', 'profession', 'nationality', 'position_title', 'official_process_status',
    'flight_date', 'departure_city', 'arrival_city', 'start_date',
  ],
  offers: ['candidate_name', 'position_title', 'monthly_net_salary', 'currency', 'start_date', 'terms_details', 'status'],
} as const;

/** Fields that must never reach an employer export, whatever the input row carries. */
export const EMPLOYER_EXPORT_FORBIDDEN = [
  'id', 'candidate_id', 'match_id', 'request_id', 'employer_id',
  'panova_notes', 'internal_notes', 'referral_code',
  'phone', 'email', 'passport_number', 'passport', 'birth_date', 'address', 'emergency_contact',
  'file_url', 'file_name', 'documents', 'doc_type', 'review_note',
  'flight_number', 'followups', 'video_url', 'video_url_1', 'video_url_2', 'video_url_3',
  'assigned_to', 'assigned_backup', 'is_demo',
] as const;

/** Labels the page already has, passed in so this file stays free of UI copy. */
export type EmployerExportCopy = {
  requestStatus: (status: string) => string;
  offerStatus: (status: string) => string;
  duration: (text: string) => string;
  officialProcess: (status: string) => string;
};

type Row = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

/** A calendar day in the export language (lib/exportLists.ts exportDate). */
function day(value: unknown, lang: Language): string {
  return exportDate(value, lang);
}

function profession(value: unknown, lang: Language): string {
  const raw = text(value).trim();
  return professionLabel(raw, lang) ?? raw;
}

/** Requests on the home tab (job_requests rows the page loaded). */
export function employerRequestRows(rows: readonly Row[], lang: Language, copy: EmployerExportCopy): Row[] {
  return rows.map((row) => ({
    position_title: localizeCatalogTitle(text(row.position_title), lang),
    headcount: row.headcount ?? '',
    city: text(row.city),
    country: exportCountry(row.country, lang),
    monthly_net_salary: exportAmount(offerAmount(row), lang),
    currency: requestCurrency(row),
    contract_type: copy.duration(text(row.contract_type)),
    target_start_date: day(row.target_start_date, lang),
    status: copy.requestStatus(text(row.status)),
    created_at: day(row.created_at, lang),
  }));
}

/** "Selected candidates" tab (the page's selectedCandidates list). */
export function employerSelectedRows(rows: readonly Row[], lang: Language): Row[] {
  return rows.map((row) => ({
    full_name: text(row.full_name),
    profession: profession(row.profession, lang),
    nationality: exportCountry(row.nationality, lang),
    city: text(row.city),
    experience_years: row.experience_years ?? '',
    language_skills: text(row.language_skills),
    position_title: localizeCatalogTitle(text(row.request_position_title), lang),
    decided_at: day(row.decided_at, lang),
  }));
}

/**
 * "Active employees" tab (started placements from employer_placements()).
 * Flight date and cities and the start date are in; flight number and the
 * 30/60/90-day follow-up notes are not.
 */
export function employerEmployeeRows(rows: readonly Row[], lang: Language, copy: EmployerExportCopy): Row[] {
  return rows.map((row) => ({
    full_name: text(row.full_name),
    profession: profession(row.profession, lang),
    nationality: exportCountry(row.nationality, lang),
    position_title: localizeCatalogTitle(text(row.request_position_title), lang),
    official_process_status: copy.officialProcess(text(row.official_process_status)),
    flight_date: day(row.flight_date, lang),
    departure_city: text(row.departure_city),
    arrival_city: text(row.arrival_city),
    start_date: day(row.start_date, lang),
  }));
}

/** Offers listed on the interviews tab (job_offers rows the page loaded). */
export function employerOfferRows(rows: readonly Row[], lang: Language, copy: EmployerExportCopy): Row[] {
  return rows.map((row) => ({
    candidate_name: text(row.candidate_name),
    position_title: localizeCatalogTitle(text(row.position_title), lang),
    monthly_net_salary: exportAmount(offerAmount(row), lang),
    currency: offerCurrency(row),
    start_date: day(row.start_date, lang),
    terms_details: text(row.terms_details),
    status: copy.offerStatus(text(row.status)),
  }));
}
