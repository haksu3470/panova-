'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import DemoBadge from '@/components/portal/DemoBadge';
import MatchPanel from '@/components/portal/MatchPanel';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import { Card, Stat, Field, REQUEST_STATUS_KEYS, requestStatusLabel, resultLabel, fmtDate } from '@/components/portal/file/ui';
import { matchResultTone } from '@/lib/status-tone';
import { candidateProfessionLabel } from '@/lib/candidateLabels';
import { translations } from '@/lib/dictionary';
import { dateLocale, fill, portalUi } from '@/lib/portal-ui-copy';
import { benefitsAnswered } from '@/lib/workforceRequest';
import { useSiteLanguage } from '@/lib/site-language';
import DeleteRecordButton from '@/components/portal/DeleteRecordButton';
import { useStaffRole } from '@/components/portal/useStaffRole';
import { formatCount, toPipelineCounts, type RequestPipelineCounts } from '@/lib/requestPipelineCounts';

const TEXT_FIELDS: [string, string?][] = [
  ['position_title'], ['sector'], ['headcount', 'number'],
  ['target_start_date', 'date'], ['monthly_net_salary', 'number'],
  ['working_hours'], ['weekly_days'], ['overtime_conditions'],
  ['contract_type'], ['required_experience_years', 'number'],
  ['required_language'], ['country'], ['city'],
];
const BOOL_FIELDS = ['accommodation_provided', 'food_provided', 'transport_provided', 'flight_covered', 'required_certificate'];
const NUMERIC = new Set(['headcount', 'monthly_net_salary', 'required_experience_years']);

function RequestFileInner() {
  const { id } = useParams() as { id: string };
  const [req, setReq] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [matches, setMatches] = useState<any[]>([]);
  const [cands, setCands] = useState<Record<string, any>>({});
  const [interviews, setInterviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [counts, setCounts] = useState<RequestPipelineCounts | null>(null);
  const [countsFailed, setCountsFailed] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const { currentLang, isRtl } = useSiteLanguage('tr');
  const t = translations[currentLang] || translations.tr;
  const ui = portalUi[currentLang];
  const { upper } = useStaffRole();

  const load = async () => {
    const { data: r } = await supabase.from('job_requests').select('*').eq('id', id).maybeSingle();
    setReq(r);
    if (r) {
      setForm({ ...r, special_requirements: r.special_requirements || '', closed_reason: r.closed_reason || '' });
      const [m, iv, of, pc] = await Promise.all([
        supabase.from('request_matches').select('*').eq('request_id', id).order('created_at'),
        supabase.from('interviews').select('*').eq('request_id', id).order('scheduled_at'),
        supabase.from('job_offers').select('*').eq('request_id', id),
        supabase.from('request_pipeline_counts').select('*').eq('request_id', id).maybeSingle(),
      ]);
      setMatches(m.data || []); setInterviews(iv.data || []); setOffers(of.data || []);
      if (pc.error) console.error('request pipeline counts failed', pc.error.code || pc.error.message);
      setCounts(pc.data && !pc.error ? toPipelineCounts(pc.data) : null);
      setCountsFailed(!!pc.error);
      const cids = Array.from(new Set((m.data || []).map((x) => x.candidate_id)));
      if (cids.length) {
        const { data: c } = await supabase.from('job_candidates').select('id, full_name, profession, nationality, is_demo').in('id', cids);
        setCands(Object.fromEntries((c || []).map((x) => [x.id, x])));
      } else setCands({});
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const save = async () => {
    if (!req) return;
    const benefitGap = benefitsAnswered(form.accommodation_provided, form.food_provided);
    if (benefitGap === 'both') { setMsg(t.lodgingAndMealsRequired || ''); return; }
    if (benefitGap === 'lodging') { setMsg(t.lodgingRequired || ''); return; }
    if (benefitGap === 'meals') { setMsg(t.mealsRequired || ''); return; }
    setSaving(true); setMsg('');
    const keys = [...TEXT_FIELDS.map((f) => f[0]), ...BOOL_FIELDS, 'status', 'special_requirements', 'closed_reason'];
    const changes: Record<string, any> = {};
    for (const k of keys) {
      let v = form[k];
      if (NUMERIC.has(k)) v = v === '' || v == null ? null : Number(v);
      else if (typeof v === 'string') v = v === '' ? null : v;
      if ((req[k] ?? null) !== (v ?? null)) changes[k] = v;
    }
    if (changes.status === 'cancelled' || changes.status === 'completed') changes.closed_at = new Date().toISOString();
    if (!Object.keys(changes).length) { setSaving(false); setMsg(ui.noChanges); return; }
    const { error } = await supabase.from('job_requests').update(changes).eq('id', id);
    if (error) setMsg(`${ui.errorPrefix} ${error.message}`);
    else {
      await writeAudit(`${ui.requestInfo}: ${req.position_title}`, 'job_request', id, { fields: Object.keys(changes), status: changes.status });
      setReq({ ...req, ...changes }); setMsg(t.savedSuccess || 'OK');
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground font-bold">{ui.loading}</div>;
  if (!req) return <div className="min-h-screen flex items-center justify-center text-red-700 font-bold">{ui.requestNotFound}</div>;

  // Same numbers as the employer card, only from request_pipeline_counts.
  // No row or an error shows a dash, never a client-side count.
  const matched = formatCount(counts?.matched);
  const presented = formatCount(counts?.presented);
  const selected = formatCount(counts?.selected);
  const interviewCount = formatCount(counts?.interviews);
  const offerCount = formatCount(counts?.offers);
  const accepted = formatCount(counts?.offers_accepted);

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {showMatch && <MatchPanel request={req} onClose={() => { setShowMatch(false); load(); }} />}
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <Link href="/portal" className="text-xs font-bold text-muted-foreground hover:text-slate-800">← {t.returnToPortal || t.returnHome}</Link>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900">📋 {req.position_title}<DemoBadge show={req.is_demo} /></h1>
            <div className="text-[11px] text-muted-foreground flex flex-wrap gap-2">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">PNV-REQ-{req.id.substring(0, 6)}</span>
              {req.employer_id ? (
                <Link href={`/portal/employers/${req.employer_id}`} className="font-bold text-emerald-700 hover:underline">🏢 {req.employer_name || ui.employerWord}</Link>
              ) : <span>🏢 {req.employer_name || '—'}</span>}
              <span>📅 {fill(ui.createdOn, { date: fmtDate(req.created_at) })}</span>
              <span className="font-bold text-slate-700">{requestStatusLabel(t, req.status)}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button onClick={() => setShowMatch(true)} className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow">🔗 {ui.matchCandidates}</button>
            <DeleteRecordButton
              table="job_requests"
              id={req.id}
              name={req.position_title || req.id}
              isDemo={req.is_demo}
              allowed={upper}
              onDeleted={() => { window.location.href = '/portal'; }}
            />
            <button onClick={save} disabled={saving} className="bg-brand-solid hover:bg-brand text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow">{saving ? (t.saving || '...') : t.saveBtn}</button>
          </div>
        </div>
        {msg && <div className="text-xs font-bold text-slate-700">{msg}</div>}

        {countsFailed ? (
          <p role="status" className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{t.countsUnavailable}</p>
        ) : null}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label={ui.statMatched} value={matched} />
          <Stat label={ui.statPresented} value={presented} />
          <Stat label={ui.statSelected} value={`${selected}/${req.headcount || 0}`} />
          <Stat label={ui.statInterviews} value={interviewCount} />
          <Stat label={ui.statOffers} value={`${offerCount} (${accepted})`} />
        </div>

        <Card title={ui.requestInfo}>
          <label className="block text-xs font-bold text-slate-600 space-y-1">
            <span>{ui.status}</span>
            <select value={form.status || 'new_request'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              {REQUEST_STATUS_KEYS.map((key) => <option key={key} value={key}>{requestStatusLabel(t, key)}</option>)}
            </select>
          </label>
          {(form.status === 'cancelled' || form.status === 'completed') && (
            <Field label={ui.closeReason} value={form.closed_reason || ''} onChange={(v) => setForm({ ...form, closed_reason: v })} />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEXT_FIELDS.map(([key, type]) => (
              <Field key={key} label={ui.requestFields[key] || key} type={type} value={form[key] == null ? '' : String(form[key]).substring(0, type === 'date' ? 10 : undefined)} onChange={(v) => setForm({ ...form, [key]: v })} />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['accommodation_provided', 'food_provided'] as const).map((key) => (
              <label key={key} className="block text-xs font-bold text-slate-600 space-y-1">
                <span>{key === 'accommodation_provided' ? t.facilityAccommodation : t.facilityFood} *</span>
                <select
                  required
                  aria-required="true"
                  value={form[key] === true ? 'yes' : form[key] === false ? 'no' : ''}
                  onChange={(e) => setForm({
                    ...form,
                    [key]: e.target.value === 'yes' ? true : e.target.value === 'no' ? false : null,
                  })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 bg-white"
                >
                  <option value="">{t.benefitSelectPlaceholder}</option>
                  <option value="yes">{t.benefitProvided}</option>
                  <option value="no">{t.benefitNotProvided}</option>
                </select>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {BOOL_FIELDS.filter((key) => key !== 'accommodation_provided' && key !== 'food_provided').map((key) => (
              <label key={key} className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 border rounded-xl px-3 py-2">
                <input type="checkbox" className="w-4 h-4" checked={!!form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} /> {ui.requestBools[key]}
              </label>
            ))}
          </div>
          <Field label={ui.specialTerms} textarea value={form.special_requirements || ''} onChange={(v) => setForm({ ...form, special_requirements: v })} />
        </Card>

        <Card title={`${ui.matchedCandidates} (${matches.length})`} right={<button onClick={() => setShowMatch(true)} className="text-xs font-bold text-emerald-700">{ui.manage} →</button>}>
          {matches.length === 0 ? <p className="text-xs text-muted-foreground">{ui.noneBound}</p> : (
            <ul className="divide-y">
              {matches.map((m) => {
                const c = cands[m.candidate_id];
                const ivs = interviews.filter((i) => i.candidate_id === m.candidate_id);
                const of = offers.find((o) => o.candidate_id === m.candidate_id);
                return (
                  <li key={m.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm">
                    <div>
                      <Link href={`/portal/candidates/${m.candidate_id}`} className="font-bold text-slate-900 hover:underline">{c?.full_name || ui.candidateWord}</Link>
                      <DemoBadge show={m.is_demo} />
                      <div className="text-[11px] text-muted-foreground">{candidateProfessionLabel(c?.profession, '—', currentLang)} · {c?.nationality || '—'} · {m.presented_at ? fill(ui.presentedOn, { date: fmtDate(m.presented_at) }) : ui.notPresented} · {ui.interview} {ivs.length}{of ? ` · ${ui.offer}: ${ui.offerStatus[of.status] || of.status}` : ''}</div>
                    </div>
                    <span className={`inline-flex w-fit shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold ${matchResultTone(m.employer_result)}`}>{resultLabel(ui, m.employer_result) || '—'}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card title={`${ui.interviewsTitle} (${interviews.length})`}>
          {interviews.length === 0 ? <p className="text-xs text-muted-foreground">{ui.noInterviews}</p> : (
            <ul className="divide-y text-sm">
              {interviews.map((i) => (
                <li key={i.id} className="py-2">🤝 <strong>{cands[i.candidate_id]?.full_name || ui.candidateWord}</strong><DemoBadge show={i.is_demo} /> <span className="text-[11px] text-muted-foreground">· {i.scheduled_at ? new Date(i.scheduled_at).toLocaleString(dateLocale[currentLang]) : '—'} · {ui.intStatus[i.status] || i.status || '—'}{i.result ? ` · ${resultLabel(ui, i.result) || i.result}` : ''}</span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function RequestFilePage() {
  return (
    <AuthGuard role="staff">
      <RequestFileInner />
    </AuthGuard>
  );
}
