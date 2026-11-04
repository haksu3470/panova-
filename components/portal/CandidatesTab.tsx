'use client';

import { useState } from 'react';
import { Search, RefreshCw, Trash2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import DemoBadge from './DemoBadge';
import { EuropeanCountryOptions } from '@/components/site/EuropeanCountryOptions';
import { toLanguage } from '@/lib/europeanCountries';
import { supabase } from '@/lib/supabase';
import {
  candidateFilterLabels,
  candidatePassportLabel,
  candidatePlaceLabel,
  candidateProfessionLabel,
  candidateSectorChoices,
  candidateSectorLabel,
  sameSector,
} from '@/lib/candidateLabels';
import { fill, portalUi } from '@/lib/portal-ui-copy';
import {
  canManagerDeleteOpenCandidate,
  isSourceCountryOfficer,
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
  updateCandidateStatus: (id: string, status: string) => void;
  logAudit: (action: string, performer?: string) => void;
  currentUser: any;
  isUpperManagement: boolean;
}

const emptyDraft = {
  fullName: '',
  nationality: '',
  phone: '',
  email: '',
  profession: '',
  sector: 'construction',
  referralCode: '',
};

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
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isSourceOfficer = isSourceCountryOfficer(currentUser?.role_level);
  const ownCode = isSourceOfficer ? normalizeReferralCode(currentUser?.referral_code) : null;
  const assignableCodes = supervisorReferralCodes(staffMembers);
  const filterCodes = isUpperManagement ? referralFilterCodes(staffMembers, candidates) : [];

  const filteredCandidates = candidates.filter((cand) => {
    const code = normalizeReferralCode(cand.referral_code) || '';
    const matchesSearch =
      (cand.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (cand.profession?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (cand.passport_no?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (cand.passport_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (cand.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSector = sameSector(cand.sector, selectedSector);
    const matchesStatus = selectedStatus === 'all' || cand.status === selectedStatus;
    const matchesCountry = selectedCountry === 'all' || (cand.country && cand.country.toLowerCase() === selectedCountry.toLowerCase());
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

  const explainWriteError = (message: string) => {
    if (message.includes('unknown_supervisor_code')) return ui.unknownSupervisorCode;
    if (message.includes('source_officer_missing_code') || message.includes('staff_members_referral_code_role')) {
      return ui.sourceOfficerMissingCode;
    }
    return message;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const payload: Record<string, string | null> = {
      full_name: draft.fullName.trim(),
      nationality: draft.nationality.trim(),
      phone: draft.phone.trim(),
      email: draft.email.trim() ? draft.email.trim().toLowerCase() : null,
      profession: draft.profession.trim(),
      sector: draft.sector,
      status: 'pending',
    };
    if (!isSourceOfficer && isUpperManagement && draft.referralCode) {
      payload.referral_code = draft.referralCode;
    }

    const { error } = await supabase.from('job_candidates').insert(payload).select('id, referral_code').single();
    setSaving(false);
    if (error) {
      alert(`${ui.registerCandidateFailed} ${explainWriteError(error.message)}`);
      return;
    }
    logAudit(ui.registerCandidateSaved, currentUser?.name);
    setDraft(emptyDraft);
    setShowRegister(false);
    alert(ui.registerCandidateSaved);
    fetchAllData();
  };

  const handleDeleteOpen = async (candidate: { id: string; full_name?: string; referral_code?: string | null }) => {
    if (!canManagerDeleteOpenCandidate(isUpperManagement, candidate.referral_code) || deletingId) return;
    if (!confirm(ui.confirmDeleteOpenCandidate)) return;
    setDeletingId(candidate.id);
    const { data, error } = await supabase.from('job_candidates').delete().eq('id', candidate.id).select('id');
    setDeletingId(null);
    if (error || !data?.length) {
      alert(`${ui.deleteOpenFailed} ${error ? explainWriteError(error.message) : ''}`.trim());
      return;
    }
    logAudit(`${ui.deleteOpenDone} ${candidate.full_name || ''}`.trim(), currentUser?.name);
    setSelectedIds((ids) => ids.filter((id) => id !== candidate.id));
    fetchAllData();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-slate-900">{ui.registerCandidate}</h3>
          <p className="text-xs text-slate-500">
            {isSourceOfficer
              ? (ownCode ? fill(ui.registerCandidateHint, { code: ownCode }) : ui.referralCodeAutoAttach)
              : ui.registerCandidateOpenHint}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowRegister((open) => !open)}
          className="inline-flex items-center justify-center gap-1.5 bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" /> {ui.registerCandidate}
        </button>
      </div>

      {showRegister && (
        <form onSubmit={handleRegister} className="bg-white p-4 rounded-2xl border shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <input
              required
              value={draft.nationality}
              onChange={(e) => setDraft({ ...draft, nationality: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
            />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            {t.phoneLabel}
            <input
              required
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
            />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            {t.emailLabel}
            <input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
            />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            {ui.positionLabel}
            <input
              required
              value={draft.profession}
              onChange={(e) => setDraft({ ...draft, profession: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
            />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            {ui.sectorLabel}
            <select
              value={draft.sector}
              onChange={(e) => setDraft({ ...draft, sector: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-semibold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
            >
              {ui.formSectors.map((sector) => (
                <option key={sector.value} value={sector.value}>{sector.label}</option>
              ))}
            </select>
          </label>
          {isSourceOfficer && (
            <label className="block text-xs font-bold text-slate-700 sm:col-span-2">
              {ui.referralCode}
              <input
                readOnly
                aria-readonly="true"
                value={ownCode ?? ''}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-mono font-bold text-slate-900 bg-slate-100 outline-none"
              />
              <span className="mt-1 block text-[11px] font-medium text-slate-500">{ui.referralCodeImmutable}</span>
            </label>
          )}
          {!isSourceOfficer && isUpperManagement && (
            <label className="block text-xs font-bold text-slate-700 sm:col-span-2">
              {ui.referralCode}
              <select
                value={draft.referralCode}
                onChange={(e) => setDraft({ ...draft, referralCode: e.target.value })}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm font-semibold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-[#2e7d32]"
              >
                <option value="">{ui.referralCodeNone}</option>
                {assignableCodes.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </label>
          )}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-60"
            >
              {saving ? t.submitting : ui.registerCandidate}
            </button>
          </div>
        </form>
      )}

      <div className={`bg-white p-4 rounded-2xl border shadow-sm grid grid-cols-1 sm:grid-cols-2 ${isUpperManagement ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3`}>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 rtl:left-auto rtl:right-3" />
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
            <EuropeanCountryOptions lang={lang} />
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
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900">
          <span>{fill(ui.candidateListCount, { shown: filteredCandidates.length, total: candidates.length })}</span>
          <button
            type="button"
            onClick={fetchAllData}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {ui.refresh}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b">
              <tr>
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredCandidates.length}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map((candidate) => {
                const isSelected = selectedIds.includes(candidate.id);
                const code = normalizeReferralCode(candidate.referral_code);
                const canDelete = canManagerDeleteOpenCandidate(isUpperManagement, candidate.referral_code);
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
                      <Link href={`/portal/candidates/${candidate.id}`} className="hover:text-[#2e7d32] hover:underline">
                        {candidate.full_name}<DemoBadge show={candidate.is_demo} />
                      </Link>
                    </td>
                    <td className="p-4">
                      {code ? (
                        <span className="font-mono text-xs font-bold text-slate-800">{code}</span>
                      ) : (
                        <span className="text-slate-400">{ui.referralCodeEmpty}</span>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteOpen(candidate)}
                          disabled={deletingId === candidate.id}
                          className="mt-1 flex items-center gap-1 text-[11px] font-bold text-red-700 hover:text-red-900 cursor-pointer disabled:opacity-60"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> {ui.deleteOpenCandidate}
                        </button>
                      )}
                    </td>
                    <td className="p-4">
                      <div>{candidatePassportLabel(candidate.passport_number || candidate.passport_no, ui.unspecified)}</div>
                      <div className="text-[11px] text-slate-400">{candidatePlaceLabel(candidate.nationality, candidate.country, lang, ui.unspecified)}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800">{candidateProfessionLabel(candidate.profession, ui.unspecified)}</span>
                      <div className="text-[11px] text-slate-400">{candidateSectorLabel(candidate.sector, ui, t)}</div>
                    </td>
                    <td className="p-4">
                      <select
                        value={candidate.assigned_to || staffMembers[0]?.name}
                        onChange={(e) => updateCandidateAssignee(candidate.id, e.target.value)}
                        aria-label={t.assigneeText}
                        className="px-3 py-1.5 rounded-lg border text-xs font-bold bg-emerald-50 text-emerald-900 cursor-pointer outline-none"
                      >
                        {staffMembers.map((staff) => (
                          <option key={staff.id} value={staff.name} className="text-slate-900 bg-white">{staff.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        value={candidate.status || 'pending'}
                        onChange={(e) => updateCandidateStatus(candidate.id, e.target.value)}
                        aria-label={t.colVisaStatus}
                        className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase cursor-pointer bg-slate-50 text-slate-900"
                      >
                        <option value="pending" className="text-slate-900 bg-white">🟡 {t.pendingStatus}</option>
                        <option value="reviewing" className="text-slate-900 bg-white">🔵 {t.reviewingStatus}</option>
                        <option value="visa_processing" className="text-slate-900 bg-white">🟣 {t.visaProcessingStatus}</option>
                        <option value="approved" className="text-slate-900 bg-white">🟢 {t.approvedStatus}</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
