'use client';

import { useState } from 'react';
import { ChevronRight, Search, RefreshCw, UserPlus } from 'lucide-react';
import Link from 'next/link';
import DemoBadge from './DemoBadge';
import { RegistrationCountryOptions } from '@/components/site/RegistrationCountryOptions';
import { sameNationality } from '@/lib/registrationCountries';
import { candidateExportRows } from '@/lib/exportLists';
import ListExportBar from './ListExportBar';
import ScrollTable from './ScrollTable';
import DeleteRecordButton, { DELETE_ROW_CLASS } from './DeleteRecordButton';
import OfficialProcessBadge from './OfficialProcessBadge';
import CandidateStatusControl from './CandidateStatusControl';
import QuickRegisterForm from './QuickRegisterForm';
import type { CandidateStatusErrorKey } from '@/lib/candidateStatusChange';
import { toLanguage } from '@/lib/europeanCountries';
import {
  candidateFilterLabels,
  candidatePassportLabel,
  candidatePlaceLabel,
  candidateProfessionLabel,
  candidateSectorChoices,
  candidateSectorLabel,
  sameSector,
} from '@/lib/candidateLabels';
import { professionSearchBlob } from '@/lib/professions';
import { fill, portalUi } from '@/lib/portal-ui-copy';
import {
  isCodeIssuingRole,
  matchesReferralCodeFilter,
  normalizeReferralCode,
  referralFilterCodes,
  supervisorReferralCodes,
} from '@/lib/referralCode';

interface CandidatesTabProps {
  candidates: any[];
  staffMembers: any[];
  currentLang: string;
  t: any;
  fetchAllData: () => void;
  updateCandidateAssignee: (id: string, assignee: string) => void;
  /** staff_set_candidate_status (upper management, with a reason); error key or null. */
  updateCandidateStatus: (id: string, status: string, reason: string) => Promise<CandidateStatusErrorKey | null>;
  /** canUpdateRequestStatus(role): shows "Change manually"; others see a badge only. */
  canChangeStatus?: boolean;
  /** canAssignCandidate(role): field officers see the responsible person read-only. */
  canAssign?: boolean;
  logAudit: (action: string, performer?: string) => void;
  currentUser: any;
  isUpperManagement: boolean;
}

type CandidateRow = CandidatesTabProps['candidates'][number];

export default function CandidatesTab({
  candidates,
  staffMembers,
  currentLang,
  t,
  fetchAllData,
  updateCandidateAssignee,
  updateCandidateStatus,
  logAudit,
  currentUser,
  isUpperManagement,
  canChangeStatus = false,
  canAssign = false,
}: CandidatesTabProps) {
  const lang = toLanguage(currentLang);
  const ui = portalUi[lang];
  const filters = candidateFilterLabels(t);
  const sectorChoices = candidateSectorChoices(ui, t);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [codeFilter, setCodeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showRegister, setShowRegister] = useState(false);

  // Source-country officers and field officers register under their own code.
  const isCodeIssuer = isCodeIssuingRole(currentUser?.role_level);
  const ownCode = isCodeIssuer ? normalizeReferralCode(currentUser?.referral_code) : null;
  const assignableCodes = supervisorReferralCodes(staffMembers);
  const filterCodes = isUpperManagement ? referralFilterCodes(staffMembers, candidates) : [];

  const filteredCandidates = candidates.filter((cand) => {
    const code = normalizeReferralCode(cand.referral_code) || '';
    const matchesSearch =
      (cand.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      professionSearchBlob(cand.profession).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cand.passport_no?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (cand.passport_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (cand.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = sameSector(cand.sector, selectedSector);
    const matchesStatus = selectedStatus === 'all' || cand.status === selectedStatus;
    const matchesCountry = sameNationality(cand.nationality || cand.country, selectedCountry);
    const matchesCode = !isUpperManagement || matchesReferralCodeFilter(cand.referral_code, codeFilter);

    return matchesSearch && matchesSector && matchesStatus && matchesCountry && matchesCode;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCandidates.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const registerHint = isCodeIssuer
    ? (ownCode ? fill(ui.registerCandidateHint, { code: ownCode }) : ui.referralCodeAutoAttach)
    : ui.registerCandidateOpenHint;
  const allShownSelected = selectedIds.length > 0 && selectedIds.length === filteredCandidates.length;

  const assigneeControl = (candidate: CandidateRow) => (canAssign ? (
    <select
      value={candidate.assigned_to || ''}
      onChange={(e) => updateCandidateAssignee(candidate.id, e.target.value)}
      aria-label={t.assigneeText}
      className="max-w-full px-3 py-1.5 rounded-lg border text-xs font-bold bg-emerald-50 text-emerald-900 cursor-pointer outline-none"
    >
      <option value="" className="text-slate-900 bg-white">—</option>
      {staffMembers.map((staff) => (
        <option key={staff.id} value={staff.id} className="text-slate-900 bg-white">{staff.name}</option>
      ))}
    </select>
  ) : (
    <span className="text-xs font-bold text-slate-800" aria-label={t.assigneeText}>
      {staffMembers.find((staff) => staff.id === candidate.assigned_to)?.name || '—'}
    </span>
  ));

  const deleteButton = (candidate: CandidateRow, code: string | null) => (
    <DeleteRecordButton
      table="job_candidates"
      id={candidate.id}
      name={code ? `${candidate.full_name || candidate.id} (${code})` : (candidate.full_name || candidate.id)}
      isDemo={candidate.is_demo}
      allowed={isUpperManagement}
      onDeleted={() => {
        setSelectedIds((ids) => ids.filter((id) => id !== candidate.id));
        fetchAllData();
      }}
    />
  );

  const statusControl = (candidate: CandidateRow) => (
    <CandidateStatusControl
      t={t}
      status={candidate.status}
      canChange={canChangeStatus}
      compact
      onSubmit={(status, reason) => updateCandidateStatus(candidate.id, status, reason)}
    />
  );

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-slate-900">{ui.registerCandidate}</h3>
          {/* on phones the hint is shown inside the form when it is opened */}
          <p className="hidden sm:block text-xs text-muted-foreground">{registerHint}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ListExportBar
            filename="candidates"
            title={t.candidatesTab || 'Candidates'}
            lang={lang}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            rows={candidateExportRows(filteredCandidates, lang, {
              candidateStatus: t.colVisaStatus || 'candidate_status',
              officialProcess: t.officialProcessLabel || 'official_process',
              statusLabels: {
                pending: t.pendingStatus || 'pending',
                reviewing: t.reviewingStatus || 'reviewing',
                visa_processing: t.visaProcessingStatus || 'visa_processing',
                approved: t.approvedStatus || 'approved',
              },
              steps: ui.steps,
              stopped: t.plProcessStopped || ui.steps.rejected,
            }).map((row) => ({
              ...row,
              profession: candidateProfessionLabel(String(row.profession ?? ''), '', lang),
            }))}
            labels={{ csv: ui.exportCsv, excel: ui.exportExcel, print: ui.exportPrint, empty: ui.exportEmpty, popupBlocked: ui.exportPopupBlocked }}
          />
          <button
            type="button"
            onClick={() => setShowRegister((open) => !open)}
            className="inline-flex items-center justify-center gap-1.5 bg-brand-solid hover:bg-brand text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" /> {ui.registerCandidate}
          </button>
        </div>
      </div>

      {showRegister && (
        <QuickRegisterForm
          currentLang={currentLang}
          t={t}
          currentUser={currentUser}
          isUpperManagement={isUpperManagement}
          assignableCodes={assignableCodes}
          candidates={candidates}
          logAudit={logAudit}
          onSaved={() => {
            fetchAllData();
          }}
        />
      )}

      <div className={`bg-white p-4 rounded-2xl border shadow-sm grid grid-cols-1 sm:grid-cols-2 ${isUpperManagement ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3`}>
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5 rtl:left-auto rtl:right-3" />
          <input
            type="text"
            placeholder={t.searchPlaceholder || ''}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label={t.searchPlaceholder || ''}
            className="w-full pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none text-slate-900 font-medium bg-white focus:ring-2 focus:ring-[#2e7d32]"
          />
        </div>

        <div>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            aria-label={ui.sectorLabel}
            className="w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold text-slate-900 bg-white cursor-pointer outline-none focus:ring-2 focus:ring-[#2e7d32]"
          >
            <option value="all">{filters.allSectors}</option>
            {sectorChoices.map((sector) => (
              <option key={sector.value} value={sector.value}>{sector.label}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label={t.allstatuses}
            className="w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold text-slate-900 bg-white cursor-pointer outline-none focus:ring-2 focus:ring-[#2e7d32]"
          >
            <option value="all">{t.allstatuses}</option>
            <option value="pending">{t.pendingStatus}</option>
            <option value="reviewing">{t.reviewingStatus}</option>
            <option value="visa_processing">{t.visaProcessingStatus}</option>
            <option value="approved">{t.approvedStatus}</option>
          </select>
        </div>

        <div>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            aria-label={t.nationalityCol}
            className="w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold text-slate-900 bg-white cursor-pointer outline-none focus:ring-2 focus:ring-[#2e7d32]"
          >
            <option value="all">{filters.allCountries}</option>
            <RegistrationCountryOptions lang={lang} />
          </select>
        </div>

        {isUpperManagement && (
          <div>
            <select
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value)}
              aria-label={ui.referralFilterLabel}
              className="w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold text-slate-900 bg-white cursor-pointer outline-none focus:ring-2 focus:ring-[#2e7d32]"
            >
              <option value="all">{ui.referralCodeAll}</option>
              <option value="none">{ui.referralCodeNone}</option>
              {filterCodes.map((code) => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-bold text-slate-900">
          <span>{fill(ui.candidateListCount, { shown: filteredCandidates.length, total: candidates.length })}</span>
          <button
            type="button"
            onClick={fetchAllData}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {ui.refresh}
          </button>
        </div>
        {/* Phones (<640px): one card per candidate. From sm the table below. */}
        <div className="sm:hidden">
          {filteredCandidates.length > 0 ? (
            <label className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allShownSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 accent-[#2e7d32] cursor-pointer"
              />
              {ui.selectAllShown}
            </label>
          ) : null}
          <ul className="divide-y divide-slate-100" data-list="candidate-cards">
            {filteredCandidates.map((candidate) => {
              const isSelected = selectedIds.includes(candidate.id);
              const code = normalizeReferralCode(candidate.referral_code);
              return (
                <li key={candidate.id} className={`p-4 space-y-3 text-xs text-slate-600 ${isSelected ? 'bg-emerald-50' : ''}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(candidate.id)}
                      aria-label={candidate.full_name || t.colCandidate}
                      className="mt-0.5 w-4 h-4 shrink-0 accent-[#2e7d32] cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <Link href={`/portal/candidates/${candidate.id}`} className="text-sm font-bold text-slate-900 hover:text-brand hover:underline [overflow-wrap:anywhere]">
                        {candidate.full_name}<DemoBadge show={candidate.is_demo} />
                      </Link>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{candidatePlaceLabel(candidate.nationality, candidate.country, lang, ui.unspecified)}</div>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
                    <div className="col-span-2 min-w-0">
                      <dt className="text-[11px] font-bold text-muted-foreground">{t.colProfSector}</dt>
                      <dd className="font-semibold text-slate-800 [overflow-wrap:anywhere]">
                        {candidateProfessionLabel(candidate.profession, ui.unspecified, lang)}
                        <span className="font-normal text-muted-foreground"> · {candidateSectorLabel(candidate.sector, ui, t)}</span>
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-bold text-muted-foreground">{t.colPassportNat}</dt>
                      <dd className="[overflow-wrap:anywhere]">{candidatePassportLabel(candidate.passport_number || candidate.passport_no, ui.unspecified)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-bold text-muted-foreground">{ui.referralCode}</dt>
                      <dd className="flex flex-wrap items-center gap-1">
                        {code ? <span dir="ltr" className="font-mono font-bold text-slate-800">{code}</span> : <span className="text-muted-foreground">{ui.referralCodeEmpty}</span>}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-bold text-muted-foreground">{t.colVisaStatus}</dt>
                      <dd>{statusControl(candidate)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-bold text-muted-foreground">{t.officialProcessLabel}</dt>
                      <dd><OfficialProcessBadge status={candidate.official_process_status} steps={ui.steps} stoppedLabel={t.plProcessStopped || ui.steps.rejected} /></dd>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <dt className="text-[11px] font-bold text-muted-foreground">🛡️ {t.assigneeText}</dt>
                      <dd>{assigneeControl(candidate)}</dd>
                    </div>
                  </dl>
                  <Link
                    href={`/portal/candidates/${candidate.id}`}
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    {ui.openCandidateFile}
                    <ChevronRight aria-hidden className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Link>
                  {isUpperManagement ? (
                    <div data-delete-row className={DELETE_ROW_CLASS}>{deleteButton(candidate, code)}</div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="hidden sm:block">
        <ScrollTable>
          <table className="w-full text-left rtl:text-right text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b">
              <tr>
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allShownSelected}
                    onChange={handleSelectAll}
                    aria-label={t.colCandidate}
                    className="w-4 h-4 accent-[#2e7d32] cursor-pointer"
                  />
                </th>
                <th className="p-4">{t.colCandidate}</th>
                <th className="p-4">{ui.referralCode}</th>
                <th className="p-4">{t.colPassportNat}</th>
                <th className="p-4">{t.colProfSector}</th>
                <th className="p-4">🛡️ {t.assigneeText}</th>
                <th className="p-4">{t.colVisaStatus}</th>
                <th className="p-4">{t.officialProcessLabel}</th>
                {/* delete column: no visible heading, named for screen readers */}
                {isUpperManagement ? <th className="p-4 text-end"><span className="sr-only">{ui.deleteRecord}</span></th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map((candidate) => {
                const isSelected = selectedIds.includes(candidate.id);
                const code = normalizeReferralCode(candidate.referral_code);
                return (
                  <tr key={candidate.id} className={`hover:bg-slate-50 ${isSelected ? 'bg-emerald-50' : ''}`}>
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(candidate.id)}
                        aria-label={candidate.full_name || t.colCandidate}
                        className="w-4 h-4 accent-[#2e7d32] cursor-pointer"
                      />
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      <Link href={`/portal/candidates/${candidate.id}`} className="hover:text-brand hover:underline">
                        {candidate.full_name}<DemoBadge show={candidate.is_demo} />
                      </Link>
                    </td>
                    <td className="p-4">
                      {code ? (
                        <span className="font-mono text-xs font-bold text-slate-800">{code}</span>
                      ) : (
                        <span className="text-muted-foreground">{ui.referralCodeEmpty}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div>{candidatePassportLabel(candidate.passport_number || candidate.passport_no, ui.unspecified)}</div>
                      <div className="text-[11px] text-muted-foreground">{candidatePlaceLabel(candidate.nationality, candidate.country, lang, ui.unspecified)}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800">{candidateProfessionLabel(candidate.profession, ui.unspecified, lang)}</span>
                      <div className="text-[11px] text-muted-foreground">{candidateSectorLabel(candidate.sector, ui, t)}</div>
                    </td>
                    <td className="p-4">{assigneeControl(candidate)}</td>
                    <td className="p-4">{statusControl(candidate)}</td>
                    <td className="p-4">
                      <OfficialProcessBadge status={candidate.official_process_status} steps={ui.steps} stoppedLabel={t.plProcessStopped || ui.steps.rejected} />
                    </td>
                    {isUpperManagement ? <td className="p-4 text-end" data-delete-cell>{deleteButton(candidate, code)}</td> : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollTable>
        </div>
      </div>
    </div>
  );
}
