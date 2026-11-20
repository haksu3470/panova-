/**
 * Staff quick registration (phone first): payload, duplicate warning and
 * per-document upload. kvkk_recorded_by, kvkk_version and registered_by are
 * never sent: the database trigger stamp_candidate_referral_code writes them.
 *
 * Step 2 uses the same five slots as Belge Takip Mekanizması (DOC_SLOT_TYPES),
 * each with camera + file pick, so a CV is never labeled as "certificate".
 */
import { DOC_SLOT_TYPES } from './candidateDocuments';
import { passportKey, phoneKey } from './loginIdentifier';

export const QUICK_DOC_TYPES = DOC_SLOT_TYPES;
export type QuickDocType = (typeof QUICK_DOC_TYPES)[number];

export type QuickDraft = {
  fullName: string;
  nationality: string;
  phone: string;
  email: string;
  profession: string;
  sector: string;
  passport: string;
  birthYear: string;
  kvkk: boolean;
  referralCode: string;
};

export type QuickProblem = 'kvkk' | 'birth_year' | 'passport';

export function quickRegistrationProblem(draft: QuickDraft, now = new Date()): QuickProblem | null {
  if (!draft.kvkk) return 'kvkk';
  const year = draft.birthYear.trim();
  if (year) {
    const n = Number(year);
    const current = now.getFullYear();
    if (!/^\d{4}$/.test(year) || n < current - 100 || n > current - 14) return 'birth_year';
  }
  if (draft.passport.trim() && !passportKey(draft.passport)) return 'passport';
  return null;
}

/** Insert payload for job_candidates. nationality is already canonical. */
export function quickRegistrationPayload(
  draft: QuickDraft,
  opts: { nationality: string; allowReferralCode: boolean; now?: Date },
): Record<string, string | number | null> {
  const payload: Record<string, string | number | null> = {
    full_name: draft.fullName.trim(),
    nationality: opts.nationality,
    phone: draft.phone.trim(),
    email: draft.email.trim() ? draft.email.trim().toLowerCase() : null,
    profession: draft.profession.trim(),
    sector: draft.sector,
    status: 'pending',
    kvkk_accepted_at: (opts.now ?? new Date()).toISOString(),
  };
  const passport = passportKey(draft.passport);
  if (passport) payload.passport_number = passport;
  if (/^\d{4}$/.test(draft.birthYear.trim())) payload.birth_year = Number(draft.birthYear.trim());
  if (opts.allowReferralCode && draft.referralCode) payload.referral_code = draft.referralCode;
  return payload;
}

function phoneMatchKey(value: string | null | undefined): string | null {
  const key = phoneKey(value);
  if (key) return key;
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length >= 7 ? digits : null;
}

export type DuplicateHit = { field: 'phone' | 'passport'; id: string; name: string };
export type VisibleCandidate = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  passport_number?: string | null;
  passport_no?: string | null;
};

/** Duplicates among the rows the user can see (RLS); hidden rows are not found. */
export function findVisibleDuplicates(input: { phone: string; passport: string }, rows: VisibleCandidate[]): DuplicateHit[] {
  const phone = phoneMatchKey(input.phone);
  const passport = passportKey(input.passport);
  const hits: DuplicateHit[] = [];
  for (const row of rows) {
    const name = row.full_name || row.id;
    if (phone && phoneMatchKey(row.phone) === phone) hits.push({ field: 'phone', id: row.id, name });
    if (passport && (passportKey(row.passport_number) === passport || passportKey(row.passport_no) === passport)) {
      hits.push({ field: 'passport', id: row.id, name });
    }
  }
  return hits;
}

/** Narrow server filters: last 4 phone digits (ilike suffix) and the passport key. */
export function duplicateQueryTerms(input: { phone: string; passport: string }): { phoneSuffix: string | null; passport: string | null } {
  const digits = input.phone.replace(/\D/g, '');
  return { phoneSuffix: digits.length >= 7 ? digits.slice(-4) : null, passport: passportKey(input.passport) };
}

/** The unique phone / passport indexes refuse a second row (23505). */
export function isDuplicateInsertError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === '23505' || /unique_candidate_(phone|passport)_key/.test(error.message || '');
}

export type DocError = 'type' | 'size' | 'empty' | 'upload';
export type DocRowState =
  | { status: 'idle' }
  | { status: 'working' }
  | { status: 'done'; fileName: string }
  | { status: 'error'; error: DocError; file?: File };

/** Same row the candidate page writes (app/candidate/page.tsx handleDocUpload). */
export function quickDocumentRow(candidateId: string, docType: string, fileUrl: string, fileName: string, now = new Date()) {
  return {
    candidate_id: candidateId,
    doc_type: docType,
    file_url: fileUrl,
    status: 'uploaded',
    uploaded_at: now.toISOString(),
    notes: fileName,
  };
}

export async function uploadQuickDocument(
  candidateId: string,
  docType: string,
  file: File,
  deps: {
    prepare: (file: File) => Promise<{ ok: true; file: File } | { ok: false; error: 'type' | 'size' | 'empty' }>;
    upload: (candidateId: string, docType: string, file: File) => Promise<string>;
    insert: (row: ReturnType<typeof quickDocumentRow>) => Promise<{ error: unknown }>;
  },
): Promise<DocRowState> {
  const prepared = await deps.prepare(file);
  if (!prepared.ok) return { status: 'error', error: prepared.error };
  try {
    const url = await deps.upload(candidateId, docType, prepared.file);
    const { error } = await deps.insert(quickDocumentRow(candidateId, docType, url, file.name));
    if (error) return { status: 'error', error: 'upload', file };
    return { status: 'done', fileName: file.name };
  } catch (error) {
    if (error === 'type' || error === 'size') return { status: 'error', error };
    return { status: 'error', error: 'upload', file };
  }
}

/** One row changes; the others stay as they were. */
export function withDocState<T extends string>(rows: Record<T, DocRowState>, type: T, next: DocRowState): Record<T, DocRowState> {
  return { ...rows, [type]: next };
}
