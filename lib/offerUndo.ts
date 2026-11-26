import type { Language } from './dictionary';

/**
 * Taking back an answer to an offer (accepted / rejected -> pending).
 * The same rule is enforced by public.undo_offer_response (migration
 * 20261126160000); keep the two in step.
 * - Candidate: within OFFER_UNDO_HOURS of answering, and only before the
 *   official process reaches the work permit application.
 * - Staff who may write offers: any time.
 */
export const OFFER_UNDO_HOURS = 48;

/** From here on the employer has started paperwork, so only staff can take the answer back. */
export const OFFER_UNDO_BLOCKING_STEPS = [
  'work_permit_applied',
  'work_permit_approved',
  'visa_applied',
  'visa_approved',
  'ready_to_travel',
  'started_work',
] as const;

export function candidateCanUndoOffer(
  offer: { status?: string | null; responded_at?: string | null },
  officialProcessStatus: string | null | undefined,
  now: number = Date.now(),
): boolean {
  if (offer.status !== 'accepted' && offer.status !== 'rejected') return false;
  const answered = offer.responded_at ? Date.parse(offer.responded_at) : NaN;
  if (!Number.isFinite(answered) || now - answered > OFFER_UNDO_HOURS * 3600 * 1000) return false;
  return !(OFFER_UNDO_BLOCKING_STEPS as readonly string[]).includes(officialProcessStatus || '');
}

export const offerUndoLabels: Record<Language, { button: string; confirm: string; done: string; failed: string; staffButton: string }> = {
  tr: {
    button: 'Yanıtımı geri al',
    confirm: 'Yanıtınız geri alınacak ve teklif yeniden "yanıt bekliyor" olacak. Devam edilsin mi?',
    done: 'Yanıt geri alındı; teklifi yeniden yanıtlayabilirsiniz.',
    failed: 'Yanıt geri alınamadı.',
    staffButton: 'Adayın yanıtını geri al',
  },
  en: {
    button: 'Take back my answer',
    confirm: 'Your answer will be taken back and the offer will await an answer again. Continue?',
    done: 'Answer taken back; you can answer the offer again.',
    failed: 'The answer could not be taken back.',
    staffButton: "Take back the candidate's answer",
  },
  sq: {
    button: 'Tërhiq përgjigjen time',
    confirm: 'Përgjigjja juaj do të tërhiqet dhe oferta do të presë sërish përgjigje. Të vazhdohet?',
    done: 'Përgjigjja u tërhoq; mund t’i përgjigjeni sërish ofertës.',
    failed: 'Përgjigjja nuk u tërhoq.',
    staffButton: 'Tërhiq përgjigjen e kandidatit',
  },
  ar: {
    button: 'التراجع عن ردي',
    confirm: 'سيتم التراجع عن ردك وسيعود العرض بانتظار الرد. هل تريد المتابعة؟',
    done: 'تم التراجع عن الرد؛ يمكنك الرد على العرض مجددًا.',
    failed: 'تعذّر التراجع عن الرد.',
    staffButton: 'التراجع عن رد المرشح',
  },
  mk: {
    button: 'Повлечи го мојот одговор',
    confirm: 'Вашиот одговор ќе биде повлечен и понудата повторно ќе чека одговор. Да продолжиме?',
    done: 'Одговорот е повлечен; можете повторно да одговорите на понудата.',
    failed: 'Одговорот не може да се повлече.',
    staffButton: 'Повлечи го одговорот на кандидатот',
  },
};
