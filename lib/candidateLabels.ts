import { translations, type Language, type Translation } from './dictionary';
import { registrationCountries } from './registrationCountries';
import { SECTOR_FILTER_CODES, normalizeFilterText, sectorFilterLabel } from './employerCandidateFilters';
import { portalUi, type PortalUi } from './portal-ui-copy';
import { LEGACY_SECTOR_LABELS, professionLabel } from './professions';

/**
 * Display labels for the staff candidate list and its sector / country filters.
 * A catalog profession key renders in the active locale.
 * Stored free text (a profession someone typed) is left as entered.
 * Sector codes, known country names, and the Turkish "not specified" sentinel
 * follow the active locale.
 */

function fold(value: string): string {
  // Turkish locale maps ASCII "I" to dotless "ı", so "AGRICULTURE" would miss "agriculture".
  return value.trim().toLocaleLowerCase('tr-TR').replaceAll('ı', 'i');
}

const UNSPECIFIED = new Set<string>(
  [
    'n/a',
    'na',
    'n.a.',
    '-',
    '—',
    ...Object.values(portalUi).map((ui) => ui.unspecified),
    ...Object.values(translations).map((item) => item.benefitUnanswered || ''),
  ].map(fold).filter(Boolean),
);

const COUNTRIES = new Map<string, ReturnType<typeof registrationCountries>[number]>();
for (const country of registrationCountries()) {
  COUNTRIES.set(fold(country.value), country);
  COUNTRIES.set(fold(country.code), country);
  for (const name of Object.values(country.names)) COUNTRIES.set(fold(name), country);
}

const SECTOR_CODE_BY_ALIAS = new Map<string, string>();

function rememberSectorAlias(alias: string, code: string) {
  const key = fold(alias);
  if (!key) return;
  const existing = SECTOR_CODE_BY_ALIAS.get(key);
  if (existing && existing !== code) return;
  SECTOR_CODE_BY_ALIAS.set(key, code);
}

for (const code of SECTOR_FILTER_CODES) rememberSectorAlias(code, code);
for (const ui of Object.values(portalUi)) {
  for (const sector of ui.formSectors) {
    rememberSectorAlias(sector.value, sector.value);
    rememberSectorAlias(sector.label, sector.value);
  }
}
for (const copy of Object.values(translations)) {
  for (const code of SECTOR_FILTER_CODES) {
    rememberSectorAlias(sectorFilterLabel(code, copy), code);
  }
}
for (const [code, labels] of Object.entries(LEGACY_SECTOR_LABELS)) {
  for (const label of labels) rememberSectorAlias(label, code);
}

export function isUnspecifiedLabel(value: string | null | undefined): boolean {
  const folded = fold(value ?? '');
  return folded.length === 0 || UNSPECIFIED.has(folded);
}

function sectorCode(value: string | null | undefined): string | null {
  const raw = (value ?? '').trim();
  if (!raw || isUnspecifiedLabel(raw)) return null;
  return SECTOR_CODE_BY_ALIAS.get(fold(raw)) ?? null;
}

export function candidateFilterLabels(t: Pick<Translation, 'empCandAnySector' | 'empCandAnyCountry'>) {
  return {
    allSectors: t.empCandAnySector || '',
    allCountries: t.empCandAnyCountry || '',
  };
}

/** Sector choices for the candidate filter. Form labels win so the list matches the register form. */
export function candidateSectorChoices(ui: PortalUi, t: Translation): { value: string; label: string }[] {
  const seen = new Set(ui.formSectors.map((sector) => sector.value));
  const extras = SECTOR_FILTER_CODES
    .filter((code) => !seen.has(code))
    .map((code) => ({ value: code, label: sectorFilterLabel(code, t) }));
  return [...ui.formSectors, ...extras];
}

export function candidateSectorLabel(sector: string | null | undefined, ui: PortalUi, t: Translation): string {
  const raw = (sector ?? '').trim();
  if (!raw || isUnspecifiedLabel(raw)) return ui.unspecified;
  const code = sectorCode(raw);
  if (!code) return raw;
  const fromForm = ui.formSectors.find((item) => item.value === code);
  if (fromForm) return fromForm.label;
  const labeled = sectorFilterLabel(code, t);
  return labeled === code ? raw : labeled;
}

export function sameSector(stored: string | null | undefined, selected: string): boolean {
  if (selected === 'all') return true;
  const code = sectorCode(stored);
  if (code) return code === selected;
  return normalizeFilterText(stored) === normalizeFilterText(selected);
}

export function candidateProfessionLabel(
  profession: string | null | undefined,
  unspecified: string,
  lang: Language = 'tr',
): string {
  const raw = (profession ?? '').trim();
  if (!raw || isUnspecifiedLabel(raw)) return unspecified;
  return professionLabel(raw, lang) ?? raw;
}

/** The five standard document slots ('1'..'5') and their dictionary keys. */
const DOCUMENT_TITLE_KEY = {
  '1': 'docPassportScan',
  '2': 'docProfessionalCert',
  '3': 'docCriminalRecord',
  '4': 'docHealthReport',
  '5': 'docApostille',
} as const satisfies Record<string, keyof Translation>;

export type DocumentTitleCopy = Pick<Translation, (typeof DOCUMENT_TITLE_KEY)[keyof typeof DOCUMENT_TITLE_KEY]>;

/**
 * Document name in the active language, by slot number ('1'..'5'; `slot`
 * first, then `id`). The stored name is kept for documents added by hand
 * (any other number), because it was typed in one language only.
 */
export function candidateDocumentTitle(
  doc: { id?: unknown; slot?: unknown; name?: unknown } | null | undefined,
  t: DocumentTitleCopy,
): string {
  const stored = typeof doc?.name === 'string' ? doc.name.trim() : '';
  for (const value of [doc?.slot, doc?.id]) {
    const code = value == null ? '' : String(value).trim();
    if (code in DOCUMENT_TITLE_KEY) {
      const label = t[DOCUMENT_TITLE_KEY[code as keyof typeof DOCUMENT_TITLE_KEY]];
      if (typeof label === 'string' && label.trim()) return label;
    }
  }
  return stored;
}

export function candidatePlaceLabel(
  nationality: string | null | undefined,
  country: string | null | undefined,
  lang: Language,
  unspecified: string,
): string {
  const nat = (nationality ?? '').trim();
  const place = nat && !isUnspecifiedLabel(nat) ? nat : (country ?? '').trim();
  if (!place || isUnspecifiedLabel(place)) return unspecified;
  return COUNTRIES.get(fold(place))?.names[lang] ?? place;
}

export function candidatePassportLabel(value: string | null | undefined, unspecified: string): string {
  const raw = (value ?? '').trim();
  if (!raw || isUnspecifiedLabel(raw)) return unspecified;
  return raw;
}
