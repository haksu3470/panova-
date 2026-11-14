import { translations, type Language } from './dictionary';
import { normalizeDemandStatus } from './demandStatus';
import { requestStatusText } from './exportLists';
import { portalUi } from './portal-ui-copy';

/**
 * Display only: audit rows keep their stored text. Status codes written by the
 * database (for example "Üst Yönetim talep durumunu el ile değiştirdi:
 * new_request -> presenting_candidates") and table names (entity_type) are shown
 * with the 5-language labels. A code or table we do not know stays as written.
 */

const CANDIDATE_ENTITIES = new Set(['job_candidate', 'job_candidates', 'candidate']);
const CANDIDATE_LABEL_KEYS = {
  pending: 'pendingStatus',
  reviewing: 'reviewingStatus',
  visa_processing: 'visaProcessingStatus',
  approved: 'approvedStatus',
} as const;

/** Label for one status code; candidate codes on candidate rows, request codes otherwise. */
export function auditStatusLabel(code: string, entity: string | null | undefined, lang: Language): string {
  const t = translations[lang] || translations.tr;
  const key = code.toLowerCase();
  if (CANDIDATE_ENTITIES.has(String(entity ?? '')) && key in CANDIDATE_LABEL_KEYS) {
    return t[CANDIDATE_LABEL_KEYS[key as keyof typeof CANDIDATE_LABEL_KEYS]] || code;
  }
  if (normalizeDemandStatus(key)) return requestStatusText(key, lang) || code;
  if (key in CANDIDATE_LABEL_KEYS) return t[CANDIDATE_LABEL_KEYS[key as keyof typeof CANDIDATE_LABEL_KEYS]] || code;
  return code;
}

const CODE = '([a-z][a-z_]*[a-z])';

/** The action text with the codes around an arrow ("->" or "→") translated; nothing else changes. */
export function auditActionText(action: string | null | undefined, entity: string | null | undefined, lang: Language): string {
  const text = String(action ?? '');
  return text
    // code before an arrow
    .replace(new RegExp(`(^|[\\s:(])${CODE}(?=\\s*(?:->|→))`, 'g'), (_, lead: string, code: string) => `${lead}${auditStatusLabel(code, entity, lang)}`)
    // code after an arrow
    .replace(new RegExp(`((?:->|→)\\s*)${CODE}(?=$|[\\s,.;)])`, 'g'), (_, arrow: string, code: string) => `${arrow}${auditStatusLabel(code, entity, lang)}`)
    .replace(/\s->\s/g, ' → ');
}

/** Readable name of the audited table; unknown names stay as written. */
export function auditEntityLabel(entity: string | null | undefined, lang: Language): string {
  const raw = String(entity ?? '').trim();
  if (!raw) return '';
  const labels = (portalUi[lang] || portalUi.tr).auditEntities;
  return labels[raw] || raw;
}
