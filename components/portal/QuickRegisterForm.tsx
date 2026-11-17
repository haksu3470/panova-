'use client';

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { Camera, CheckCircle2, Paperclip } from 'lucide-react';
import { RegistrationCountryOptions } from '@/components/site/RegistrationCountryOptions';
import { ProfessionField } from '@/components/site/ProfessionField';
import { canonicalNationality } from '@/lib/registrationCountries';
import { professionForSectorChange } from '@/lib/professions';
import { fill, portalUi } from '@/lib/portal-ui-copy';
import { toLanguage } from '@/lib/europeanCountries';
import { isCodeIssuingRole, normalizeReferralCode } from '@/lib/referralCode';
import { supabase } from '@/lib/supabase';
import { uploadCandidateFile } from '@/lib/candidateFiles';
import { prepareDocumentFile } from '@/lib/imageDownscale';
import {
  QUICK_DOC_TYPES,
  duplicateQueryTerms,
  findVisibleDuplicates,
  isDuplicateInsertError,
  quickRegistrationPayload,
  quickRegistrationProblem,
  uploadQuickDocument,
  withDocState,
  type DocRowState,
  type DuplicateHit,
  type QuickDocType,
  type QuickDraft,
} from '@/lib/quickRegistration';

type VisibleRow = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  passport_number?: string | null;
  passport_no?: string | null;
};

const emptyDraft = (): QuickDraft => ({
  fullName: '',
  nationality: '',
  phone: '',
  email: '',
  profession: '',
  sector: 'construction',
  passport: '',
  birthYear: '',
  kvkk: false,
  referralCode: '',
});

const idleDocs = (): Record<QuickDocType, DocRowState> => ({
  passport: { status: 'idle' },
  certificate: { status: 'idle' },
});

export default function QuickRegisterForm({
  currentLang,
  t,
  currentUser,
  isUpperManagement,
  assignableCodes,
  candidates,
  onSaved,
  logAudit,
}: {
  currentLang: string;
  t: { nameLabel: string; nationalityCol: string; phoneLabel: string; emailLabel: string; submitting: string };
  currentUser: { name?: string; role_level?: string; referral_code?: string | null } | null;
  isUpperManagement: boolean;
  assignableCodes: string[];
  candidates: VisibleRow[];
  onSaved: () => void;
  logAudit: (action: string, performer?: string) => void;
}) {
  const lang = toLanguage(currentLang);
  const ui = portalUi[lang];
  const qr = ui.quickRegister;

  const isCodeIssuer = isCodeIssuingRole(currentUser?.role_level);
  const ownCode = isCodeIssuer ? normalizeReferralCode(currentUser?.referral_code) : null;
  const registerHint = isCodeIssuer
    ? ownCode
      ? fill(ui.registerCandidateHint, { code: ownCode })
      : ui.referralCodeAutoAttach
    : ui.registerCandidateOpenHint;

  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState<QuickDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateHit[]>([]);
  const [forceDuplicate, setForceDuplicate] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedName, setSavedName] = useState('');
  const [docs, setDocs] = useState(idleDocs);
  const cameraRef = useRef<HTMLInputElement>(null);
  const cameraDocType = useRef<QuickDocType>('passport');

  const reset = () => {
    setStep(1);
    setDraft(emptyDraft());
    setSaving(false);
    setFieldError(null);
    setDuplicates([]);
    setForceDuplicate(false);
    setSavedId(null);
    setSavedName('');
    setDocs(idleDocs());
  };

  const explainWriteError = (message: string) => {
    if (message.includes('unknown_supervisor_code')) return ui.unknownSupervisorCode;
    if (message.includes('source_officer_missing_code') || message.includes('staff_members_referral_code_role')) {
      return ui.sourceOfficerMissingCode;
    }
    return message;
  };

  const loadServerDuplicates = async (input: { phone: string; passport: string }): Promise<VisibleRow[]> => {
    const terms = duplicateQueryTerms(input);
    const rows: VisibleRow[] = [];
    if (terms.phoneSuffix) {
      const { data } = await supabase
        .from('job_candidates')
        .select('id, full_name, phone, passport_number, passport_no')
        .ilike('phone', `%${terms.phoneSuffix}`)
        .limit(20);
      if (data) rows.push(...(data as VisibleRow[]));
    }
    if (terms.passport) {
      const { data } = await supabase
        .from('job_candidates')
        .select('id, full_name, phone, passport_number, passport_no')
        .or(`passport_number.eq.${terms.passport},passport_no.eq.${terms.passport}`)
        .limit(20);
      if (data) rows.push(...(data as VisibleRow[]));
    }
    return rows;
  };

  const saveStep1 = async (allowDuplicate: boolean) => {
    if (saving) return;
    setFieldError(null);

    const problem = quickRegistrationProblem(draft);
    if (problem === 'kvkk') {
      setFieldError(qr.kvkkRequired);
      return;
    }
    if (problem === 'birth_year') {
      setFieldError(qr.birthYearInvalid);
      return;
    }
    if (problem === 'passport') {
      setFieldError(qr.passportInvalid);
      return;
    }

    if (!allowDuplicate) {
      const serverRows = await loadServerDuplicates({ phone: draft.phone, passport: draft.passport });
      const hits = findVisibleDuplicates(
        { phone: draft.phone, passport: draft.passport },
        [...candidates, ...serverRows],
      );
      if (hits.length) {
        setDuplicates(hits);
        return;
      }
    }

    setSaving(true);
    const nationality = canonicalNationality(draft.nationality) || draft.nationality.trim();
    const payload = quickRegistrationPayload(draft, {
      nationality,
      allowReferralCode: !isCodeIssuer && isUpperManagement,
    });

    const { data, error } = await supabase.from('job_candidates').insert(payload).select('id, full_name').single();
    setSaving(false);

    if (error) {
      if (isDuplicateInsertError(error)) {
        setFieldError(qr.duplicateBlocked);
        setForceDuplicate(false);
        return;
      }
      setFieldError(`${ui.registerCandidateFailed} ${explainWriteError(error.message)}`);
      return;
    }

    const id = data?.id as string;
    const name = (data?.full_name as string) || draft.fullName.trim();
    logAudit(fill(qr.savedNotice, { name }), currentUser?.name);
    setSavedId(id);
    setSavedName(name);
    setDuplicates([]);
    setForceDuplicate(false);
    setStep(2);
    onSaved();
  };

  const handleStep1 = async (e: FormEvent) => {
    e.preventDefault();
    await saveStep1(forceDuplicate);
  };

  const uploadDoc = async (docType: QuickDocType, file: File) => {
    if (!savedId) return;
    setDocs((prev) => withDocState(prev, docType, { status: 'working' }));
    const next = await uploadQuickDocument(savedId, docType, file, {
      prepare: prepareDocumentFile,
      upload: (candidateId, type, prepared) => uploadCandidateFile(candidateId, type, prepared, 'document'),
      insert: async (row) => {
        const { error } = await supabase.from('candidate_documents').insert(row);
        return { error };
      },
    });
    setDocs((prev) => withDocState(prev, docType, next));
  };

  const onFilePicked = (docType: QuickDocType, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void uploadDoc(docType, file);
  };

  const openCamera = (docType: QuickDocType) => {
    cameraDocType.current = docType;
    cameraRef.current?.click();
  };

  const finish = () => {
    const count = QUICK_DOC_TYPES.filter((type) => docs[type].status === 'done').length;
    alert(fill(qr.finishedNotice, { name: savedName, count: String(count) }));
    reset();
    onSaved();
  };

  const docLabel = (type: QuickDocType) => (type === 'passport' ? qr.docPassport : qr.docCertificate);

  const docErrorText = (state: Extract<DocRowState, { status: 'error' }>) => {
    if (state.error === 'type') return qr.uploadType;
    if (state.error === 'size') return qr.uploadSize;
    if (state.error === 'empty') return qr.uploadType;
    return qr.uploadFailed;
  };

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-4">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => onFilePicked(cameraDocType.current, e)}
      />

      {step === 1 && (
        <form onSubmit={handleStep1} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 lg:col-span-3 space-y-1">
            <h4 className="text-sm font-extrabold text-slate-900">{qr.step1Title}</h4>
            <p className="text-xs text-muted-foreground">{registerHint}</p>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            {t.nameLabel}
            <input
              required
              value={draft.fullName}
              onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
            />
          </label>

          <label className="block text-xs font-bold text-slate-700">
            {t.nationalityCol}
            <select
              required
              value={draft.nationality}
              onChange={(e) => setDraft({ ...draft, nationality: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
            >
              <option value="">{ui.selectCountry}</option>
              <RegistrationCountryOptions lang={lang} currentValue={draft.nationality} />
            </select>
          </label>

          <label className="block text-xs font-bold text-slate-700">
            {t.phoneLabel}
            <input
              required
              inputMode="tel"
              autoComplete="tel"
              value={draft.phone}
              onChange={(e) => {
                setForceDuplicate(false);
                setDuplicates([]);
                setDraft({ ...draft, phone: e.target.value });
              }}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
            />
          </label>

          <label className="block text-xs font-bold text-slate-700">
            {qr.emailOptional}
            <input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
            />
          </label>

          <label className="block text-xs font-bold text-slate-700" htmlFor="quick-profession">
            {ui.positionLabel}
            <ProfessionField
              id="quick-profession"
              lang={lang}
              sector={draft.sector}
              value={draft.profession}
              required
              onChange={(profession) => setDraft({ ...draft, profession })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
            />
          </label>

          <label className="block text-xs font-bold text-slate-700">
            {ui.sectorLabel}
            <select
              value={draft.sector}
              onChange={(e) => {
                const sector = e.target.value;
                setDraft({ ...draft, sector, profession: professionForSectorChange(draft.profession, sector) });
              }}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-semibold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
            >
              {ui.formSectors.map((sector) => (
                <option key={sector.value} value={sector.value}>
                  {sector.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold text-slate-700">
            {qr.passportOptional}
            <input
              value={draft.passport}
              onChange={(e) => {
                setForceDuplicate(false);
                setDuplicates([]);
                setDraft({ ...draft, passport: e.target.value });
              }}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
            />
          </label>

          <label className="block text-xs font-bold text-slate-700">
            {qr.birthYearOptional}
            <input
              inputMode="numeric"
              maxLength={4}
              value={draft.birthYear}
              onChange={(e) => setDraft({ ...draft, birthYear: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
            />
          </label>

          {isCodeIssuer && (
            <label className="block text-xs font-bold text-slate-700 sm:col-span-2">
              {ui.referralCode}
              <input
                readOnly
                aria-readonly="true"
                value={ownCode ?? ''}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-mono font-bold text-slate-900 bg-slate-100 outline-none"
              />
              <span className="mt-1 block text-[11px] font-medium text-muted-foreground">{ui.referralCodeImmutable}</span>
            </label>
          )}

          {!isCodeIssuer && isUpperManagement && (
            <label className="block text-xs font-bold text-slate-700 sm:col-span-2">
              {ui.referralCode}
              <select
                value={draft.referralCode}
                onChange={(e) => setDraft({ ...draft, referralCode: e.target.value })}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-semibold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
              >
                <option value="">{ui.referralCodeNone}</option>
                {assignableCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="sm:col-span-2 lg:col-span-3 flex items-start gap-2 text-xs font-bold text-slate-800">
            <input
              type="checkbox"
              checked={draft.kvkk}
              onChange={(e) => setDraft({ ...draft, kvkk: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span>
              {qr.kvkkLabel}{' '}
              <Link href="/kvkk" target="_blank" className="text-brand underline underline-offset-2">
                KVKK
              </Link>
            </span>
          </label>

          {duplicates.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
              {duplicates.map((hit) => (
                <p key={`${hit.field}-${hit.id}`} className="text-xs font-semibold text-amber-950">
                  {fill(hit.field === 'phone' ? qr.duplicatePhone : qr.duplicatePassport, { name: hit.name })}
                </p>
              ))}
              <p className="text-[11px] text-amber-900">{qr.duplicateHint}</p>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setForceDuplicate(true);
                  setDuplicates([]);
                  void saveStep1(true);
                }}
                className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-bold text-white disabled:bg-disabled disabled:text-on-dark disabled:opacity-100"
              >
                {qr.duplicateContinue}
              </button>
            </div>
          )}

          {fieldError && (
            <p className="sm:col-span-2 lg:col-span-3 text-xs font-semibold text-red-700" role="alert">
              {fieldError}
            </p>
          )}

          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:bg-disabled disabled:text-on-dark disabled:opacity-100"
            >
              {saving ? t.submitting : ui.registerCandidate}
            </button>
          </div>
        </form>
      )}

      {step === 2 && savedId && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-slate-900">{qr.step2Title}</h4>
            <p className="text-xs text-muted-foreground">{fill(qr.savedNotice, { name: savedName })}</p>
            <p className="text-xs text-muted-foreground">{qr.step2Hint}</p>
            <p className="text-[11px] text-muted-foreground">{qr.fileTypes}</p>
          </div>

          {QUICK_DOC_TYPES.map((type) => {
            const state = docs[type];
            return (
              <div key={type} className="rounded-xl border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-extrabold text-slate-900">{docLabel(type)}</p>
                  {state.status === 'done' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {qr.uploaded}
                    </span>
                  )}
                  {state.status === 'working' && <span className="text-[11px] font-bold text-slate-600">{qr.preparing}</span>}
                </div>

                {state.status === 'done' ? (
                  <p className="text-xs text-slate-700 truncate" title={state.fileName}>
                    {state.fileName}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={state.status === 'working'}
                      onClick={() => openCamera(type)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-brand hover:bg-emerald-100 disabled:bg-disabled disabled:text-on-dark disabled:opacity-100"
                    >
                      <Camera className="h-3.5 w-3.5" /> {qr.takePhoto}
                    </button>
                    <label className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-200 cursor-pointer">
                      <Paperclip className="h-3.5 w-3.5" /> {qr.chooseFile}
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                        disabled={state.status === 'working'}
                        className="sr-only"
                        onChange={(e) => onFilePicked(type, e)}
                      />
                    </label>
                    {state.status === 'error' && state.file && (
                      <button
                        type="button"
                        onClick={() => void uploadDoc(type, state.file!)}
                        className="rounded-xl border px-3 py-1.5 text-xs font-bold text-slate-800"
                      >
                        {qr.retry}
                      </button>
                    )}
                  </div>
                )}

                {state.status === 'error' && (
                  <p className="text-[11px] font-semibold text-red-700" role="alert">
                    {docErrorText(state)}
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={finish}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              {qr.finish}
            </button>
            <button
              type="button"
              onClick={finish}
              className="rounded-xl border px-4 py-2.5 text-xs font-bold text-slate-800"
            >
              {qr.skipForNow}
            </button>
            <Link
              href={`/portal/candidates/${savedId}`}
              className="inline-flex items-center rounded-xl border px-4 py-2.5 text-xs font-bold text-brand"
            >
              {qr.openFile}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
