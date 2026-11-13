'use client';

import { useEffect, useState } from 'react';
import { X, CalendarPlus, FileSignature, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import DemoBadge from './DemoBadge';
import { candidateProfessionLabel } from '@/lib/candidateLabels';
import { localizeCatalogTitle } from '@/lib/professions';
import { dateLocale, fill, portalUi } from '@/lib/portal-ui-copy';
import { OFFER_CURRENCIES, offerCurrency, offerTermsPayload } from '@/lib/offers';
import { DEFAULT_SALARY_CURRENCY, formatSalary, offerDefaultsFromRequest, requestCurrency } from '@/lib/money';
import { releaseCopy } from '@/lib/release-copy';
import { useSiteLanguage } from '@/lib/site-language';
import { translations } from '@/lib/dictionary';
import { normalizeMeetingUrl, toDateTimeLocalInput } from '@/lib/interviewMeeting';
import { canEditMeetingUrl } from '@/lib/staffAccess';
import { useStaffRole } from './useStaffRole';

const EMPTY_INTERVIEW = { id: null, scheduled_at: '', status: 'scheduled', result: '', employer_notes: '', panova_notes: '', meeting_url: '' };

interface Props {
  candidate: { id: string; full_name?: string; profession?: string; is_demo?: boolean };
  request?: any | null;
  match?: any | null;
  onClose: () => void;
}

/** Schedule interviews and create job offers. Opened from a match or a candidate file. */
export default function InterviewOfferPanel({ candidate, request, match, onClose }: Props) {
  const { currentLang } = useSiteLanguage('en');
  const ui = portalUi[currentLang];
  const t = translations[currentLang] || translations.tr;
  // Source country and field officers do not see the link field; the
  // database trigger rejects their writes to meeting_url as well.
  const { role } = useStaffRole();
  const mayEditMeetingUrl = canEditMeetingUrl(role);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const isDemo = !!(candidate.is_demo || request?.is_demo || match?.is_demo);

  const [iv, setIv] = useState<any>(EMPTY_INTERVIEW);
  const [of, setOf] = useState<any>({
    id: null,
    employer_name: request?.employer_name || '',
    position_title: localizeCatalogTitle(request?.position_title, currentLang) || candidateProfessionLabel(candidate.profession, '', currentLang),
    // Salary and currency from the request (salary may be negotiated; the
    // currency follows the request and cannot be changed). No request: EUR.
    ...offerDefaultsFromRequest(request),
    start_date: '',
    terms_details: '',
    status: 'pending',
  });

  const load = async () => {
    let qi = supabase.from('interviews').select('*').eq('candidate_id', candidate.id).order('scheduled_at', { ascending: false });
    let qo = supabase.from('job_offers').select('*').eq('candidate_id', candidate.id).order('created_at', { ascending: false });
    if (request?.id) {
      qi = qi.eq('request_id', request.id);
      qo = qo.eq('request_id', request.id);
    }
    const [i, o] = await Promise.all([qi, qo]);
    if (i.error || o.error) setError((i.error || o.error)!.message);
    setInterviews(i.data || []);
    setOffers(o.data || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate.id, request?.id]);

  const run = async (fn: () => PromiseLike<{ error: any }>, audit: string, type: string) => {
    setBusy(true);
    setError('');
    const { error: runError } = await fn();
    if (runError) setError(runError.message);
    else await writeAudit(audit, type, candidate.id, { request_id: request?.id, match_id: match?.id });
    await load();
    setBusy(false);
    return !runError;
  };

  const saveInterview = async () => {
    if (request?.id && match && !match.presented_at) return setError(releaseCopy[currentLang].mustPresent);
    if (!iv.scheduled_at) return setError(ui.ioScheduleRequired);
    const meetingUrl = mayEditMeetingUrl ? normalizeMeetingUrl(iv.meeting_url) : null;
    if (meetingUrl === undefined) return setError(t.meetingUrlInvalid || '');
    const row: Record<string, unknown> = {
      scheduled_at: new Date(iv.scheduled_at).toISOString(),
      status: iv.status,
      result: iv.result || null,
      employer_notes: iv.employer_notes || null,
      panova_notes: iv.panova_notes || null,
      updated_at: new Date().toISOString(),
    };
    // Send meeting_url when a link was typed, or when the loaded rows show the
    // column exists (so clearing a link works). Before the migration, an
    // interview without a link still saves. Roles that may not edit the link
    // never send the column, so their saves keep the existing link.
    const hasMeetingColumn = interviews.some((x) => Object.prototype.hasOwnProperty.call(x, 'meeting_url'));
    if (mayEditMeetingUrl && (meetingUrl !== null || hasMeetingColumn)) row.meeting_url = meetingUrl;
    const ok = await run(
      async () =>
        iv.id
          ? supabase.from('interviews').update(row).eq('id', iv.id)
          : supabase.from('interviews').insert({ ...row, candidate_id: candidate.id, request_id: request?.id ?? null, employer_id: request?.employer_id ?? null, is_demo: isDemo }),
      `${iv.id ? ui.ioEditInterview : ui.ioNewInterview}: ${candidate.full_name} (${iv.status}${iv.result ? '/' + iv.result : ''})`,
      'interview'
    );
    // The interview result does not decide the match. The decision is entered
    // with a reason through staff_decide_match ("Decide for employer").
    if (ok && match?.id && iv.result === 'selected' && match.employer_decision !== 'selected') {
      setNotice(t.interviewDecisionNotice || '');
    }
    if (ok) setIv(EMPTY_INTERVIEW);
  };

  const saveOffer = async () => {
    if (request?.id && match && !match.presented_at) return setError(releaseCopy[currentLang].mustPresent);
    if (!of.employer_name || !of.monthly_net_salary) return setError(ui.ioOfferRequired);
    const salary = Number(of.monthly_net_salary);
    if (!Number.isFinite(salary) || salary <= 0) return setError(ui.ioOfferRequired);
    const row = {
      employer_name: of.employer_name,
      position_title: of.position_title || null,
      monthly_net_salary: salary,
      // offer_terms.currency comes from the request, never a fixed EUR.
      offer_terms: offerTermsPayload(request ? requestCurrency(request) : of.currency || DEFAULT_SALARY_CURRENCY, of.offer_terms),
      start_date: of.start_date || null,
      terms_details: of.terms_details || null,
      status: of.status,
      updated_at: new Date().toISOString(),
    };
    const ok = await run(
      async () =>
        of.id
          ? supabase.from('job_offers').update(row).eq('id', of.id)
          : supabase.from('job_offers').insert({ ...row, status: 'pending', candidate_id: candidate.id, request_id: request?.id ?? null, employer_id: request?.employer_id ?? null, is_demo: isDemo }),
      `${of.id ? ui.ioEditOffer : ui.ioNewOffer}: ${candidate.full_name} · ${row.monthly_net_salary}`,
      'job_offer'
    );
    if (ok) setOf({ ...of, id: null, ...offerDefaultsFromRequest(request), offer_terms: undefined, start_date: '', terms_details: '', status: 'pending' });
  };

  const inp = [
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none scheme-light',
    'placeholder:text-slate-600',
    '[&::-webkit-datetime-edit]:text-slate-900 [&::-webkit-datetime-edit-fields-wrapper]:text-slate-900',
    '[&::-webkit-datetime-edit-text]:text-slate-900',
    '[&::-webkit-datetime-edit-day-field]:text-slate-900 [&::-webkit-datetime-edit-month-field]:text-slate-900 [&::-webkit-datetime-edit-year-field]:text-slate-900',
    '[&::-webkit-datetime-edit-hour-field]:text-slate-900 [&::-webkit-datetime-edit-minute-field]:text-slate-900 [&::-webkit-datetime-edit-ampm-field]:text-slate-900',
    '[&::-webkit-calendar-picker-indicator]:opacity-80',
  ].join(' ');
  const offerLocked = (o: any) => o.status === 'accepted' || o.status === 'rejected';
  const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(dateLocale[currentLang], { dateStyle: 'medium', timeStyle: 'short' }) : '—');

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white text-slate-900 scheme-light w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 space-y-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-950 text-lg">🤝 {ui.ioTitle}<DemoBadge show={isDemo} /></h3>
            <p className="text-xs font-medium text-slate-700">
              {candidate.full_name}
              {request ? ` · ${localizeCatalogTitle(request.position_title, currentLang)} · ${request.employer_name}` : ` · ${ui.ioAllRequests}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-700 hover:bg-slate-100" aria-label={ui.close}><X className="w-5 h-5" /></button>
        </div>

        {error && <p className="text-xs text-red-800 bg-red-50 p-2 rounded-lg">{error}</p>}
        {notice && <p className="text-xs text-amber-900 bg-amber-50 p-2 rounded-lg">{notice}</p>}

        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">{ui.ioInterviews} ({interviews.length})</h4>
          {interviews.map((i) => (
            <button key={i.id} onClick={() => setIv({ id: i.id, scheduled_at: toDateTimeLocalInput(i.scheduled_at), status: i.status || 'scheduled', result: i.result || '', employer_notes: i.employer_notes || '', panova_notes: i.panova_notes || '', meeting_url: i.meeting_url || '' })}
              className={`w-full text-start border border-slate-200 bg-white rounded-xl p-3 hover:bg-slate-50 ${iv.id === i.id ? 'ring-2 ring-blue-500' : ''}`}>
              <p className="text-sm font-bold text-slate-950">
                {when(i.scheduled_at)}
                <DemoBadge show={i.is_demo} />
              </p>
              <p className="text-[11px] font-medium text-slate-700">
                {ui.intStatus[i.status] || i.status}
                {i.result ? ` · ${ui.intResult[i.result] || i.result}` : ''}
                {i.panova_notes ? ` · ${i.panova_notes}` : ''}
              </p>
              {i.meeting_url ? <p className="text-[11px] font-medium text-blue-800 break-all">🔗 {i.meeting_url}</p> : null}
            </button>
          ))}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            <p className="text-xs font-bold text-slate-900">{iv.id ? ui.ioEditInterview : ui.ioNewInterview}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input type="datetime-local" value={iv.scheduled_at} onChange={(e) => setIv({ ...iv, scheduled_at: e.target.value })} className={inp} />
              <select value={iv.status} onChange={(e) => setIv({ ...iv, status: e.target.value })} className={inp}>
                {Object.entries(ui.intStatus).map(([value, label]) => <option key={value} className="bg-white text-slate-900" value={value}>{label}</option>)}
              </select>
              <select value={iv.result} onChange={(e) => setIv({ ...iv, result: e.target.value })} className={inp}>
                <option className="bg-white text-slate-900" value="">{ui.intNoResult}</option>
                {Object.entries(ui.intResult).map(([value, label]) => <option key={value} className="bg-white text-slate-900" value={value}>{label}</option>)}
              </select>
            </div>
            {mayEditMeetingUrl && (
              <label className="block text-[11px] font-bold text-slate-800 space-y-1">
                <span>{t.meetingUrlLabel}</span>
                <input
                  type="url"
                  inputMode="url"
                  maxLength={2000}
                  placeholder={t.meetingUrlPh}
                  value={iv.meeting_url}
                  onChange={(e) => setIv({ ...iv, meeting_url: e.target.value })}
                  className={inp}
                />
              </label>
            )}
            <textarea rows={2} placeholder={ui.ioEmployerNote} value={iv.employer_notes} onChange={(e) => setIv({ ...iv, employer_notes: e.target.value })} className={inp} />
            <textarea rows={2} placeholder={ui.ioPanovaNote} value={iv.panova_notes} onChange={(e) => setIv({ ...iv, panova_notes: e.target.value })} className={inp} />
            <div className="flex gap-2 justify-end">
              {iv.id && <button onClick={() => setIv(EMPTY_INTERVIEW)} className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800">{ui.ioNewInterview}</button>}
              <button disabled={busy} onClick={saveInterview} className="text-xs font-bold px-3 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-1 disabled:bg-disabled disabled:text-on-dark disabled:opacity-100">
                {iv.id ? <Save className="w-4 h-4" /> : <CalendarPlus className="w-4 h-4" />} {iv.id ? ui.save : ui.ioPlan}
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">{ui.ioJobOffers} ({offers.length})</h4>
          {offers.map((o) => (
            <button key={o.id} disabled={offerLocked(o)} onClick={() => setOf({ id: o.id, employer_name: o.employer_name || '', position_title: o.position_title || '', ...offerDefaultsFromRequest(request, o), offer_terms: o.offer_terms, start_date: o.start_date || '', terms_details: o.terms_details || '', status: o.status || 'pending' })}
              className={`w-full text-start border border-slate-200 bg-white rounded-xl p-3 hover:bg-slate-50 disabled:cursor-default ${of.id === o.id ? 'ring-2 ring-emerald-500' : ''}`}>
              <p className="text-sm font-bold text-slate-950">{o.employer_name} · {o.position_title}<DemoBadge show={o.is_demo} /></p>
              <p className="text-[11px] font-medium text-slate-700">
                {fill(ui.ioNetLine, { amount: formatSalary(o.monthly_net_salary, offerCurrency(o) || DEFAULT_SALARY_CURRENCY, dateLocale[currentLang]) || '—', date: o.start_date || '—' })} · {ui.offerStatus[o.status] || o.status}
                {o.responded_at ? ` (${String(o.responded_at).substring(0, 10)})` : ''}
              </p>
            </button>
          ))}
          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            <p className="text-xs font-bold text-slate-900">{of.id ? ui.ioEditOffer : ui.ioNewOffer}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input placeholder={`${ui.ioCompany} *`} value={of.employer_name} onChange={(e) => setOf({ ...of, employer_name: e.target.value })} className={inp} />
              <input placeholder={ui.ioPosition} value={of.position_title} onChange={(e) => setOf({ ...of, position_title: e.target.value })} className={inp} />
              <input type="number" inputMode="decimal" placeholder={`${ui.ioNetSalary} *`} value={of.monthly_net_salary} onChange={(e) => setOf({ ...of, monthly_net_salary: e.target.value })} className={inp} />
              {request ? (
                // Fixed to the request currency (job_requests.salary_currency).
                <div className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900" aria-label={ui.offerCurrency} role="note">
                  {ui.offerCurrency}: <strong>{of.currency}</strong> · {t.offerCurrencyFromRequest}
                </div>
              ) : (
                <select value={of.currency || DEFAULT_SALARY_CURRENCY} onChange={(e) => setOf({ ...of, currency: e.target.value })} className={inp} aria-label={ui.offerCurrency}>
                  {OFFER_CURRENCIES.map((code) => <option key={code} value={code} className="bg-white text-slate-900">{code}</option>)}
                </select>
              )}
              <input type="date" value={of.start_date} onChange={(e) => setOf({ ...of, start_date: e.target.value })} className={inp} />
            </div>
            <textarea rows={3} placeholder={ui.ioTerms} value={of.terms_details} onChange={(e) => setOf({ ...of, terms_details: e.target.value })} className={inp} />
            {of.id && (
              <select value={of.status} onChange={(e) => setOf({ ...of, status: e.target.value })} className={inp}>
                <option className="bg-white text-slate-900" value="pending">{ui.offerStatus.pending}</option>
                <option className="bg-white text-slate-900" value="withdrawn">{ui.offerStatus.withdrawn}</option>
              </select>
            )}
            <div className="flex gap-2 justify-end">
              {of.id && <button onClick={() => setOf({ ...of, id: null, status: 'pending' })} className="text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800">{ui.ioNewOffer}</button>}
              <button disabled={busy} onClick={saveOffer} className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-700 text-white flex items-center gap-1 disabled:bg-disabled disabled:text-on-dark disabled:opacity-100">
                <FileSignature className="w-4 h-4" /> {of.id ? ui.save : ui.ioSendOffer}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
