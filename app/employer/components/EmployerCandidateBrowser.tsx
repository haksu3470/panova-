'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { fill } from '@/lib/portal-ui-copy';
import {
  EMPTY_EMPLOYER_CANDIDATE_FILTERS,
  filterEmployerCandidates,
  isEmployerCandidateFilterActive,
  uniqueFilterOptions,
  type EmployerCandidate,
  type EmployerCandidateFilters,
  type ExperienceBand,
  type ShiftFilter,
} from '@/lib/employerCandidateFilters';

const controlClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-[#2e7d32] sm:text-sm';

export type EmployerCandidateBrowserLabels = {
  title: string;
  search: string;
  experience: string;
  anyExperience: string;
  experienceNone: string;
  experience1to3: string;
  experience3to5: string;
  experience5plus: string;
  profession: string;
  anyProfession: string;
  sector: string;
  anySector: string;
  country: string;
  anyCountry: string;
  language: string;
  anyLanguage: string;
  shift: string;
  anyShift: string;
  shiftYes: string;
  shiftNo: string;
  clear: string;
  showing: string;
  empty: string;
  noMatch: string;
  years: string;
  fullName: string;
  professionCol: string;
  nationality: string;
  action: string;
  interview: string;
  select: string;
  specialist: string;
  general: string;
};

type Props = {
  candidates: EmployerCandidate[];
  labels: EmployerCandidateBrowserLabels;
  sectorLabel: (sector: string) => string;
  onInterview: (candidate: EmployerCandidate) => void;
  onSelect: (candidate: EmployerCandidate) => void;
};

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-wide text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}

function displayName(candidate: EmployerCandidate): string {
  return candidate.full_name || '—';
}

export default function EmployerCandidateBrowser({
  candidates,
  labels,
  sectorLabel,
  onInterview,
  onSelect,
}: Props) {
  const [filters, setFilters] = useState<EmployerCandidateFilters>(EMPTY_EMPLOYER_CANDIDATE_FILTERS);
  const active = isEmployerCandidateFilterActive(filters);
  const filtered = useMemo(() => filterEmployerCandidates(candidates, filters), [candidates, filters]);
  const professions = useMemo(() => uniqueFilterOptions(candidates.map((row) => row.profession)), [candidates]);
  const sectors = useMemo(() => uniqueFilterOptions(candidates.map((row) => row.sector)), [candidates]);
  const countries = useMemo(() => uniqueFilterOptions(candidates.map((row) => row.nationality)), [candidates]);
  const languages = useMemo(() => uniqueFilterOptions(candidates.map((row) => row.language_skills)), [candidates]);

  const set = <K extends keyof EmployerCandidateFilters>(key: K, value: EmployerCandidateFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const yearsLabel = (candidate: EmployerCandidate) =>
    fill(labels.years, { years: candidate.experience_years ?? 0 });

  const shiftLabel = (candidate: EmployerCandidate) => {
    if (candidate.shift_suitable === true) return labels.shiftYes;
    if (candidate.shift_suitable === false) return labels.shiftNo;
    return '—';
  };

  const professionLine = (candidate: EmployerCandidate) => {
    const profession = candidate.profession || labels.specialist;
    const sector = candidate.sector ? sectorLabel(candidate.sector) : labels.general;
    return `${profession} (${sector})`;
  };

  const countryLine = (candidate: EmployerCandidate) => {
    const country = candidate.nationality || '—';
    return candidate.city ? `${country} · ${candidate.city}` : country;
  };

  return (
    <div className="space-y-4 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm">
      <h3 className="border-b pb-3 text-base font-extrabold text-slate-950 sm:text-lg">{labels.title}</h3>

      <div role="search" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Field id="emp-cand-search" label={labels.search}>
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="emp-cand-search"
              type="search"
              value={filters.query}
              onChange={(event) => set('query', event.target.value)}
              placeholder={labels.search}
              autoComplete="off"
              className={`${controlClass} ps-9`}
            />
          </div>
        </Field>

        <Field id="emp-cand-experience" label={labels.experience}>
          <select
            id="emp-cand-experience"
            value={filters.experience}
            onChange={(event) => set('experience', event.target.value as ExperienceBand)}
            className={controlClass}
          >
            <option value="any">{labels.anyExperience}</option>
            <option value="0">{labels.experienceNone}</option>
            <option value="1-3">{labels.experience1to3}</option>
            <option value="3-5">{labels.experience3to5}</option>
            <option value="5+">{labels.experience5plus}</option>
          </select>
        </Field>

        <Field id="emp-cand-profession" label={labels.profession}>
          <select
            id="emp-cand-profession"
            value={filters.profession}
            onChange={(event) => set('profession', event.target.value)}
            className={controlClass}
          >
            <option value="all">{labels.anyProfession}</option>
            {professions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>

        <Field id="emp-cand-sector" label={labels.sector}>
          <select
            id="emp-cand-sector"
            value={filters.sector}
            onChange={(event) => set('sector', event.target.value)}
            className={controlClass}
          >
            <option value="all">{labels.anySector}</option>
            {sectors.map((option) => (
              <option key={option.value} value={option.value}>{sectorLabel(option.label)}</option>
            ))}
          </select>
        </Field>

        <Field id="emp-cand-country" label={labels.country}>
          <select
            id="emp-cand-country"
            value={filters.nationality}
            onChange={(event) => set('nationality', event.target.value)}
            className={controlClass}
          >
            <option value="all">{labels.anyCountry}</option>
            {countries.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>

        <Field id="emp-cand-language" label={labels.language}>
          <select
            id="emp-cand-language"
            value={filters.language}
            onChange={(event) => set('language', event.target.value)}
            className={controlClass}
          >
            <option value="all">{labels.anyLanguage}</option>
            {languages.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>

        <Field id="emp-cand-shift" label={labels.shift}>
          <select
            id="emp-cand-shift"
            value={filters.shift}
            onChange={(event) => set('shift', event.target.value as ShiftFilter)}
            className={controlClass}
          >
            <option value="any">{labels.anyShift}</option>
            <option value="yes">{labels.shiftYes}</option>
            <option value="no">{labels.shiftNo}</option>
          </select>
        </Field>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setFilters(EMPTY_EMPLOYER_CANDIDATE_FILTERS)}
            disabled={!active}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            {labels.clear}
          </button>
        </div>
      </div>

      {candidates.length > 0 && (
        <p className="text-xs font-bold text-slate-600" role="status" aria-live="polite">
          {fill(labels.showing, { shown: filtered.length, total: candidates.length })}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="space-y-3 p-8 text-center text-xs text-slate-400">
          <p>{candidates.length === 0 ? labels.empty : labels.noMatch}</p>
          {candidates.length > 0 && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_EMPLOYER_CANDIDATE_FILTERS)}
              className="rounded-xl bg-slate-100 px-3.5 py-2 font-bold text-slate-700 hover:bg-slate-200"
            >
              {labels.clear}
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className="space-y-3 lg:hidden">
            {filtered.map((candidate) => (
              <li key={candidate.id} className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-extrabold text-slate-950">{displayName(candidate)}</h4>
                    <p className="text-xs text-slate-600">{professionLine(candidate)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                    {yearsLabel(candidate)}
                  </span>
                </div>
                <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="font-bold uppercase text-slate-400">{labels.country}</dt>
                    <dd className="font-semibold text-slate-800">{countryLine(candidate)}</dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase text-slate-400">{labels.language}</dt>
                    <dd className="font-semibold text-slate-800">{candidate.language_skills || '—'}</dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase text-slate-400">{labels.shift}</dt>
                    <dd className="font-semibold text-slate-800">{shiftLabel(candidate)}</dd>
                  </div>
                </dl>
                <CandidateActions candidate={candidate} labels={labels} onInterview={onInterview} onSelect={onSelect} />
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-start text-xs text-slate-700 sm:text-sm">
              <thead className="border-b bg-slate-50 font-bold text-slate-900">
                <tr>
                  <th className="p-4 font-bold">{labels.fullName}</th>
                  <th className="p-4 font-bold">{labels.professionCol}</th>
                  <th className="p-4 font-bold">{labels.experience}</th>
                  <th className="p-4 font-bold">{labels.nationality}</th>
                  <th className="p-4 font-bold">{labels.language}</th>
                  <th className="p-4 font-bold">{labels.shift}</th>
                  <th className="p-4 font-bold">{labels.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-950">{displayName(candidate)}</td>
                    <td className="p-4">{professionLine(candidate)}</td>
                    <td className="p-4">{yearsLabel(candidate)}</td>
                    <td className="p-4">{countryLine(candidate)}</td>
                    <td className="p-4">{candidate.language_skills || '—'}</td>
                    <td className="p-4">{shiftLabel(candidate)}</td>
                    <td className="p-4">
                      <CandidateActions candidate={candidate} labels={labels} onInterview={onInterview} onSelect={onSelect} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function CandidateActions({
  candidate,
  labels,
  onInterview,
  onSelect,
}: {
  candidate: EmployerCandidate;
  labels: EmployerCandidateBrowserLabels;
  onInterview: (candidate: EmployerCandidate) => void;
  onSelect: (candidate: EmployerCandidate) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onInterview(candidate)}
        className="cursor-pointer rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-blue-700 hover:bg-blue-100"
      >
        {labels.interview}
      </button>
      <button
        type="button"
        onClick={() => onSelect(candidate)}
        className="cursor-pointer rounded-lg bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700 hover:bg-emerald-100"
      >
        {labels.select}
      </button>
    </div>
  );
}
