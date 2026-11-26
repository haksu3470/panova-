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

/** Whole actions written as a code (settings switches), shown as a sentence. */
const ACTION_CODES: Record<string, Record<Language, string>> = {
  staff_member_test_account_on: { tr: 'Personel test hesabı yapıldı', en: 'Staff member made a test account', sq: 'Anëtari i stafit u bë llogari testuese', ar: 'تم جعل حساب الموظف حسابًا تجريبيًا', mk: 'Сметката на персоналот е означена како тест' },
  staff_member_test_account_off: { tr: 'Personel test hesabı kaldırıldı', en: 'Staff test account removed', sq: 'Llogaria testuese e stafit u hoq', ar: 'تمت إزالة الحساب التجريبي للموظف', mk: 'Тест сметката на персоналот е отстранета' },
  staff_member_portal_view_on: { tr: 'Aday portalını görüntüleme izni verildi', en: 'Candidate portal view allowed', sq: 'U lejua pamja e portalit të kandidatit', ar: 'تم السماح بعرض بوابة المرشح', mk: 'Дозволен е приказ на порталот на кандидатот' },
  staff_member_portal_view_off: { tr: 'Aday portalını görüntüleme izni kaldırıldı', en: 'Candidate portal view removed', sq: 'U hoq pamja e portalit të kandidatit', ar: 'تمت إزالة إذن عرض بوابة المرشح', mk: 'Отстранет е приказот на порталот на кандидатот' },
  process_metrics_on: { tr: 'Süreç metrikleri açıldı', en: 'Process metrics turned on', sq: 'Treguesit e procesit u aktivizuan', ar: 'تم تفعيل مؤشرات العملية', mk: 'Показателите на процесот се вклучени' },
  process_metrics_off: { tr: 'Süreç metrikleri kapatıldı', en: 'Process metrics turned off', sq: 'Treguesit e procesit u çaktivizuan', ar: 'تم تعطيل مؤشرات العملية', mk: 'Показателите на процесот се исклучени' },
  staff_mfa_required_on: { tr: 'İki adımlı doğrulama herkes için zorunlu yapıldı', en: 'Two-step verification required for all staff', sq: 'Verifikimi me dy hapa u bë i detyrueshëm për të gjithë', ar: 'أصبح التحقق بخطوتين إلزاميًا للجميع', mk: 'Потврдата во два чекора е задолжителна за сите' },
  staff_mfa_required_off: { tr: 'İki adımlı doğrulama zorunluluğu kaldırıldı', en: 'Two-step verification no longer required', sq: 'Verifikimi me dy hapa nuk është më i detyrueshëm', ar: 'لم يعد التحقق بخطوتين إلزاميًا', mk: 'Потврдата во два чекора веќе не е задолжителна' },
  staff_member_mfa_on: { tr: 'Personel için iki adımlı doğrulama zorunlu yapıldı', en: 'Two-step verification required for a staff member', sq: 'Verifikimi me dy hapa u bë i detyrueshëm për anëtarin', ar: 'أصبح التحقق بخطوتين إلزاميًا للموظف', mk: 'Потврдата во два чекора е задолжителна за членот' },
  staff_member_mfa_off: { tr: 'Personel için iki adımlı doğrulama zorunluluğu kaldırıldı', en: 'Two-step verification no longer required for a staff member', sq: 'Verifikimi me dy hapa nuk kërkohet më për anëtarin', ar: 'لم يعد التحقق بخطوتين إلزاميًا للموظف', mk: 'Потврдата во два чекора веќе не е задолжителна за членот' },
};

/** "Dışa aktarma: print" -> "Export: Print / PDF" in the page language. */
const EXPORT_ACTION = /^Dışa aktarma: (csv|excel|print)$/;

/** The action text with the codes around an arrow ("->" or "→") translated; nothing else changes. */
export function auditActionText(action: string | null | undefined, entity: string | null | undefined, lang: Language): string {
  const text = String(action ?? '');
  const whole = ACTION_CODES[text.trim()];
  if (whole) return whole[lang] || whole.tr;
  const exported = EXPORT_ACTION.exec(text.trim());
  if (exported) {
    const ui = portalUi[lang] || portalUi.tr;
    const kind = exported[1] === 'csv' ? ui.exportCsv : exported[1] === 'excel' ? ui.exportExcel : ui.exportPrint;
    return `${ui.auditEntities.export || 'Export'}: ${kind}`;
  }
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
