import type { Language, Translation } from './dictionary';
import { professionByKey, professionSearchBlob, professionsForSector, PROFESSIONS, PROFESSION_LOCALES } from './professions';

/**
 * Fields an employer may use to narrow the candidates already linked to their
 * requests. Contact and identity columns stay off this shape on purpose.
 */
export type EmployerCandidate = {
  id: string;
  full_name: string | null;
  profession: string | null;
  sector: string | null;
  nationality: string | null;
  city: string | null;
  experience_years: number | null;
  language_skills: string | null;
  shift_suitable: boolean | null;
  status: string | null;
  travel_status: string | null;
  created_at: string | null;
  active_request_id: string | null;
  video_url: string | null;
  video_url_1: string | null;
  video_url_2: string | null;
  video_url_3: string | null;
  /** The request match this row came from; null on the row-level fallback. */
  match_id: string | null;
  presented_at: string | null;
  employer_decision: EmployerDecision;
  /** Who entered the current decision: the employer, or staff on their behalf. */
  decision_source: DecisionSource | null;
  decided_at: string | null;
  /** Position of the request this match belongs to (rows are per match). */
  request_position_title: string | null;
};

/** Stable React key: a candidate can appear once per request. */
export function employerCandidateRowKey(row: Pick<EmployerCandidate, 'id' | 'match_id'>): string {
  return row.match_id || row.id;
}

export type DecisionSource = 'employer' | 'staff';

export function normalizeDecisionSource(value: unknown): DecisionSource | null {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return v === 'employer' || v === 'staff' ? v : null;
}

/** Shortest staff reason the database accepts (staff_decide_match). */
export const STAFF_DECISION_REASON_MIN = 5;
export const STAFF_DECISION_REASON_MAX = 1000;

export function isValidStaffDecisionReason(reason: string): boolean {
  const n = reason.trim().length;
  return n >= STAFF_DECISION_REASON_MIN && n <= STAFF_DECISION_REASON_MAX;
}

export const EMPLOYER_DECISIONS = ['pending', 'selected', 'rejected'] as const;
export type EmployerDecision = (typeof EMPLOYER_DECISIONS)[number];

/** Anything unknown or missing reads as pending. */
export function normalizeEmployerDecision(value: unknown): EmployerDecision {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return (EMPLOYER_DECISIONS as readonly string[]).includes(v) ? (v as EmployerDecision) : 'pending';
}

/** The employer can decide only on a match that was presented to them. */
export function canDecideOnMatch(candidate: Pick<EmployerCandidate, 'match_id' | 'presented_at'>): boolean {
  return !!candidate.match_id && !!candidate.presented_at;
}

export const EMPLOYER_CANDIDATE_BROWSE_COLUMNS =
  'id, full_name, profession, sector, nationality, city, experience_years, language_skills, shift_suitable, status, travel_status, created_at, active_request_id, video_url, video_url_1, video_url_2, video_url_3';

export const EXPERIENCE_BANDS = ['any', '0', '1-3', '3-5', '5+'] as const;
export type ExperienceBand = (typeof EXPERIENCE_BANDS)[number];

export const SHIFT_FILTERS = ['any', 'yes', 'no'] as const;
export type ShiftFilter = (typeof SHIFT_FILTERS)[number];

export type EmployerCandidateFilters = {
  query: string;
  experience: ExperienceBand;
  profession: string;
  sector: string;
  nationality: string;
  language: string;
  shift: ShiftFilter;
};

export const EMPTY_EMPLOYER_CANDIDATE_FILTERS: EmployerCandidateFilters = {
  query: '',
  experience: 'any',
  profession: 'all',
  sector: 'all',
  nationality: 'all',
  language: 'all',
  shift: 'any',
};

const SECTOR_LABEL_KEY: Record<string, keyof Translation> = {
  agriculture: 'sectorAgriculture',
  construction: 'sectorConstruction',
  trade: 'sectorTrade',
  hr: 'sectorHR',
  hospitality: 'sectorHospitality',
  logistics: 'sectorLogistics',
  manufacturing: 'sectorManufacturing',
  care: 'sectorCare',
};

/** Stable sector codes used by candidate and employer filters. */
export const SECTOR_FILTER_CODES = Object.keys(SECTOR_LABEL_KEY);

export function normalizeFilterText(value: string | null | undefined): string {
  return (value ?? '').trim().toLocaleLowerCase('tr-TR');
}

export function isMissingBrowseRpc(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  const message = `${error.code || ''} ${error.message || ''}`;
  return error.code === 'PGRST202' || /employer_browse_candidates|schema cache|could not find the function/i.test(message);
}

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Copy only the browse columns. Extra identity fields on the source row are dropped. */
export function toEmployerCandidate(row: Record<string, unknown>): EmployerCandidate {
  const years = row.experience_years;
  const parsedYears = years == null || years === '' ? null : Number(years);
  return {
    id: text(row.id) ?? '',
    full_name: text(row.full_name) ?? text(row.name),
    profession: text(row.profession),
    sector: text(row.sector),
    nationality: text(row.nationality) ?? text(row.country),
    city: text(row.city),
    experience_years: parsedYears == null || Number.isNaN(parsedYears) ? null : parsedYears,
    language_skills: text(row.language_skills),
    shift_suitable: typeof row.shift_suitable === 'boolean' ? row.shift_suitable : null,
    status: text(row.status),
    travel_status: text(row.travel_status),
    created_at: text(row.created_at),
    active_request_id: text(row.active_request_id),
    video_url: text(row.video_url),
    video_url_1: text(row.video_url_1),
    video_url_2: text(row.video_url_2),
    video_url_3: text(row.video_url_3),
    match_id: text(row.match_id),
    presented_at: text(row.presented_at),
    employer_decision: normalizeEmployerDecision(row.employer_decision),
    decision_source: normalizeDecisionSource(row.decision_source),
    decided_at: text(row.decided_at),
    request_position_title: text(row.request_position_title),
  };
}

export function sectorFilterLabel(sector: string, t: Pick<Translation, keyof Translation>): string {
  const key = SECTOR_LABEL_KEY[normalizeFilterText(sector)];
  const label = key ? t[key] : undefined;
  return typeof label === 'string' && label.trim() ? label : sector;
}

export function isEmployerCandidateFilterActive(filters: EmployerCandidateFilters): boolean {
  return normalizeFilterText(filters.query) !== ''
    || filters.experience !== 'any'
    || filters.profession !== 'all'
    || filters.sector !== 'all'
    || filters.nationality !== 'all'
    || filters.language !== 'all'
    || filters.shift !== 'any';
}

/** Years are inclusive on both ends of a band. Missing years count as none. */
export function matchesExperience(years: number | null | undefined, band: ExperienceBand): boolean {
  if (band === 'any') return true;
  const n = years == null || Number.isNaN(Number(years)) ? 0 : Number(years);
  if (band === '0') return n <= 0;
  if (band === '1-3') return n >= 1 && n <= 3;
  if (band === '3-5') return n >= 3 && n <= 5;
  return n >= 5;
}

export function uniqueFilterOptions(values: Array<string | null | undefined>): { value: string; label: string }[] {
  const seen = new Map<string, string>();
  for (const value of values) {
    const label = (value ?? '').trim();
    if (!label) continue;
    const key = normalizeFilterText(label);
    if (!seen.has(key)) seen.set(key, label);
  }
  return [...seen.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}

function same(value: string | null | undefined, selected: string): boolean {
  return selected === 'all' || normalizeFilterText(value) === selected;
}

function professionFromLabel(value: string): (typeof PROFESSIONS)[number] | undefined {
  const folded = normalizeFilterText(value);
  if (!folded) return undefined;
  return PROFESSIONS.find((item) => (
    PROFESSION_LOCALES.some((lang) => normalizeFilterText(item.labels[lang]) === folded)
  ));
}

/** Catalog keys match the key and every locale label. Legacy text matches itself. */
export function sameProfession(stored: string | null | undefined, selected: string): boolean {
  if (selected === 'all') return true;
  const raw = (stored ?? '').trim();
  if (normalizeFilterText(raw) === normalizeFilterText(selected)) return true;
  const selectedItem = professionByKey(selected) ?? professionFromLabel(selected);
  if (!selectedItem) return false;
  if (professionByKey(raw)?.key === selectedItem.key) return true;
  return PROFESSION_LOCALES.some((lang) => normalizeFilterText(selectedItem.labels[lang]) === normalizeFilterText(raw));
}

export function professionFilterOptions(
  rows: readonly { profession?: string | null; sector?: string | null }[],
  sector: string,
  lang: Language,
): { value: string; label: string }[] {
  const catalog = sector === 'all' ? PROFESSIONS : professionsForSector(sector);
  const options = catalog.map((item) => ({ value: item.key, label: item.labels[lang] }));
  const seen = new Set(options.map((option) => normalizeFilterText(option.value)));
  for (const row of rows) {
    const raw = (row.profession ?? '').trim();
    if (!raw || professionByKey(raw)) continue;
    if (professionFromLabel(raw)) continue;
    if (sector !== 'all' && normalizeFilterText(row.sector) !== normalizeFilterText(sector)) continue;
    const value = normalizeFilterText(raw);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    options.push({ value, label: raw });
  }
  return options.sort((a, b) => a.label.localeCompare(b.label, lang, { sensitivity: 'base' }));
}

export function filterEmployerCandidates<T extends EmployerCandidate>(
  rows: readonly T[],
  filters: EmployerCandidateFilters,
): T[] {
  const query = normalizeFilterText(filters.query);
  return rows.filter((row) => {
    if (query) {
      const haystack = `${normalizeFilterText(row.full_name)} ${normalizeFilterText(professionSearchBlob(row.profession))}`;
      if (!haystack.includes(query)) return false;
    }
    if (!matchesExperience(row.experience_years, filters.experience)) return false;
    if (!sameProfession(row.profession, filters.profession)) return false;
    if (!same(row.sector, filters.sector)) return false;
    if (!same(row.nationality, filters.nationality)) return false;
    if (!same(row.language_skills, filters.language)) return false;
    if (filters.shift === 'yes' && row.shift_suitable !== true) return false;
    if (filters.shift === 'no' && row.shift_suitable !== false) return false;
    return true;
  });
}
