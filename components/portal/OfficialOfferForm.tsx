'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileSignature, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import { translations, type Language } from '@/lib/dictionary';
import { portalUi } from '@/lib/portal-ui-copy';
import { offerTermsPayload } from '@/lib/offers';
import { DEFAULT_SALARY_CURRENCY, SALARY_CURRENCIES, SALARY_CURRENCY_SYMBOL, type SalaryCurrency } from '@/lib/money';
import { BENEFIT_KEYS, benefitLabels, type BenefitKey } from '@/lib/benefits';
import { isPermissionError } from '@/lib/staffAccess';
import { normalizePositionTitle } from '@/lib/professions';

const copy: Record<Language, { visible: string; visibleHint: string; listHint: string }> = {
  tr: {
    visible: 'İşveren portalında göster',
    visibleHint: 'İşaretli değilse teklifi yalnızca aday ve personel görür.',
    listHint: 'Listeden seçerseniz teklif o işverenin hesabına bağlanır.',
  },
  en: {
    visible: 'Show on the employer portal',
    visibleHint: 'When unticked, only the candidate and staff see the offer.',
    listHint: 'Pick from the list to link the offer to that employer account.',
  },
  sq: {
    visible: 'Shfaqe në portalin e punëdhënësit',
    visibleHint: 'Kur nuk është shënuar, oferta shihet vetëm nga kandidati dhe stafi.',
    listHint: 'Zgjidhni nga lista për ta lidhur ofertën me llogarinë e punëdhënësit.',
  },
  ar: {
    visible: 'إظهار في بوابة صاحب العمل',
    visibleHint: 'عند عدم التحديد يرى العرضَ المرشحُ والموظفون فقط.',
    listHint: 'اختر من القائمة لربط العرض بحساب صاحب العمل.',
  },
  mk: {
    visible: 'Прикажи во порталот на работодавачот',
    visibleHint: 'Ако не е означено, понудата ја гледаат само кандидатот и персоналот.',
    listHint: 'Изберете од листата за да ја поврзете понудата со сметката на работодавачот.',
  },
};

type Employer = { id: string; company_name: string | null };

interface Props {
  lang: Language;
  candidateId: string;
  candidateIsDemo: boolean;
  candidateName: string;
  /** The candidate's profession in the page language; the position starts with it. */
  defaultPosition: string;
}

/**
 * Candidate file: an offer straight to the candidate, without a request.
 * The employer is typed or picked from the employer list (then linked by id,
 * and the offer can be shown on or hidden from that employer's portal).
 */
export default function OfficialOfferForm({ lang, candidateId, candidateIsDemo, candidateName, defaultPosition }: Props) {
  const t = translations[lang] || translations.en;
  const ui = portalUi[lang];
  const c = copy[lang] || copy.en;
  const bl = benefitLabels[lang] || benefitLabels.en;

  const [employers, setEmployers] = useState<Employer[]>([]);
  const [employerName, setEmployerName] = useState('');
  const [position, setPosition] = useState(defaultPosition);
  const [salary, setSalary] = useState('');
  const [currency, setCurrency] = useState<SalaryCurrency>(DEFAULT_SALARY_CURRENCY);
  const [startDate, setStartDate] = useState('');
  const [benefits, setBenefits] = useState<BenefitKey[]>([]);
  const [terms, setTerms] = useState('');
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('employers').select('id, company_name').order('company_name').then(({ data }) => setEmployers((data as Employer[]) || []));
  }, []);

  // Exact name match (case and spaces ignored) links the offer to that employer.
  const linked = useMemo(() => {
    const key = employerName.trim().toLocaleLowerCase();
    return key ? employers.find((e) => (e.company_name || '').trim().toLocaleLowerCase() === key) || null : null;
  }, [employerName, employers]);

  const toggleBenefit = (k: BenefitKey) =>
    setBenefits((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : BENEFIT_KEYS.filter((x) => x === k || cur.includes(x))));

  const send = async () => {
    const amount = Number(salary);
    if (!employerName.trim() || !salary || !Number.isFinite(amount) || amount <= 0) {
      alert(t.fillEmployerAndSalary);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('job_offers').insert({
      candidate_id: candidateId,
      employer_name: linked?.company_name || employerName.trim(),
      employer_id: linked?.id ?? null,
      employer_visible: linked ? visible : true,
      // Catalog key when the text is a known profession (shown in each viewer's language), else the text as typed.
      position_title: normalizePositionTitle(position) || normalizePositionTitle(defaultPosition) || position.trim(),
      monthly_net_salary: amount,
      // Not tied to a request: the currency is the one picked here.
      offer_terms: offerTermsPayload(currency, benefits.length ? { benefits } : null),
      start_date: startDate || null,
      terms_details: terms.trim() || null,
      status: 'pending',
      is_demo: candidateIsDemo,
    });
    setBusy(false);
    if (error) {
      alert(isPermissionError(error) ? ui.permissionDenied : `${ui.errorPrefix} ${error.message}`);
      return;
    }
    void writeAudit(`${ui.ioNewOffer}: ${candidateName} · ${amount} ${currency}`, 'job_offer', candidateId, {
      employer_id: linked?.id ?? null,
      employer_visible: linked ? visible : true,
    });
    alert(t.offerSentSuccess);
    setEmployerName(''); setSalary(''); setStartDate(''); setTerms(''); setBenefits([]); setVisible(true);
    setPosition(defaultPosition); setCurrency(DEFAULT_SALARY_CURRENCY);
  };

  const inp = 'w-full px-3 py-2.5 rounded-xl border border-slate-300 outline-none bg-white font-medium text-slate-900';
  const lbl = 'block font-bold text-slate-700 uppercase mb-1';

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
        <FileSignature className="w-4 h-4 text-brand" /> {t.sendOfficialJobOffer}
      </h3>
      <div className="space-y-3 text-xs">
        <div>
          <label htmlFor="offer-employer" className={lbl}>{t.employerCompanyName}</label>
          <input id="offer-employer" list="offer-employer-list" value={employerName} onChange={(e) => setEmployerName(e.target.value)} placeholder={ui.exampleCompany} className={inp} autoComplete="off" />
          <datalist id="offer-employer-list">
            {employers.map((e) => e.company_name ? <option key={e.id} value={e.company_name} /> : null)}
          </datalist>
          <p className="mt-1 text-[11px] text-slate-600 font-medium">{c.listHint}</p>
        </div>
        {linked && (
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-4 h-4 accent-emerald-700" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            <span>
              <span className="font-bold text-slate-800">{c.visible}</span>
              <span className="block text-[11px] text-slate-600 font-medium">{c.visibleHint}</span>
            </span>
          </label>
        )}
        <div>
          <label htmlFor="offer-position" className={lbl}>{ui.ioPosition}</label>
          <input id="offer-position" value={position} onChange={(e) => setPosition(e.target.value)} className={inp} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="offer-salary" className={lbl}>{t.monthlyNetSalary} ({SALARY_CURRENCY_SYMBOL[currency]})</label>
            <input id="offer-salary" type="number" inputMode="decimal" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="1200" className={inp} />
          </div>
          <div>
            <label htmlFor="offer-currency" className={lbl}>{ui.offerCurrency}</label>
            {/* EUR / USD only: job_offers_currency_check refuses other codes. */}
            <select id="offer-currency" value={currency} onChange={(e) => setCurrency(e.target.value as SalaryCurrency)} className={inp}>
              {SALARY_CURRENCIES.map((code) => <option key={code} value={code}>{code} ({SALARY_CURRENCY_SYMBOL[code]})</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="offer-start" className={lbl}>{t.startDate}</label>
          <input id="offer-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`${inp} scheme-light`} />
        </div>
        <fieldset>
          <legend className={lbl}>{t.termsConditions}</legend>
          <div className="grid grid-cols-1 gap-1.5">
            {BENEFIT_KEYS.map((k) => (
              <label key={k} className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-emerald-700" checked={benefits.includes(k)} onChange={() => toggleBenefit(k)} />
                {bl[k]}
              </label>
            ))}
          </div>
          <textarea rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder={ui.exampleTerms} className={`${inp} mt-2`} aria-label={t.termsConditions} />
        </fieldset>
        <button type="button" disabled={busy} onClick={send} className="w-full bg-brand-solid hover:bg-brand text-white py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow disabled:bg-disabled disabled:text-on-dark disabled:opacity-100">
          <Send className="w-3.5 h-3.5" /> {t.sendOfferToCandidate}
        </button>
      </div>
    </div>
  );
}
