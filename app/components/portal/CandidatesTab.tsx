'use client';

import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import Link from 'next/link';

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
}

export default function CandidatesTab({
  candidates,
  staffMembers,
  currentLang,
  t,
  fetchAllData,
  updateCandidateAssignee,
  updateCandidateStatus,
  logAudit,
  currentUser
}: CandidatesTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('reviewing');
  const [updatingBulk, setUpdatingBulk] = useState(false);

  const filteredCandidates = candidates.filter((cand) => {
    const matchesSearch = 
      (cand.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (cand.profession?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (cand.passport_no?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (cand.passport_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (cand.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesSector = selectedSector === 'all' || cand.sector === selectedSector;
    const matchesStatus = selectedStatus === 'all' || cand.status === selectedStatus;
    const matchesCountry = selectedCountry === 'all' || (cand.country && cand.country.toLowerCase() === selectedCountry.toLowerCase());

    return matchesSearch && matchesSector && matchesStatus && matchesCountry;
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

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder={t.searchPlaceholder || 'Search...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm outline-none text-slate-900 font-medium bg-white focus:ring-2 focus:ring-[#2e7d32]"
          />
        </div>

        <div>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold text-slate-900 bg-white cursor-pointer outline-none focus:ring-2 focus:ring-[#2e7d32]"
          >
            <option value="all">📁 All Sectors</option>
            <option value="construction">Construction</option>
            <option value="agriculture">Agriculture</option>
            <option value="hr">General HR</option>
            <option value="trade">Foreign Trade</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
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
            className="w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold text-slate-900 bg-white cursor-pointer outline-none focus:ring-2 focus:ring-[#2e7d32]"
          >
            <option value="all">🌍 All Countries</option>
            <option value="North Macedonia">North Macedonia</option>
            <option value="Turkey">Turkey</option>
            <option value="Albania">Albania</option>
            <option value="Kosovo">Kosovo</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900">
          <span>Candidate List ({filteredCandidates.length} / {candidates.length})</span>
          <button
            onClick={fetchAllData}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b">
              <tr>
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredCandidates.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 accent-[#2e7d32] cursor-pointer"
                  />
                </th>
                <th className="p-4">{t.colCandidate}</th>
                <th className="p-4">{t.colPassportNat}</th>
                <th className="p-4">{t.colProfSector}</th>
                <th className="p-4">🛡️ {t.assigneeText}</th>
                <th className="p-4">{t.colVisaStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map((candidate) => {
                const isSelected = selectedIds.includes(candidate.id);
                return (
                  <tr key={candidate.id} className={`hover:bg-slate-50 ${isSelected ? 'bg-emerald-50' : ''}`}>
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectOne(candidate.id)}
                        className="w-4 h-4 accent-[#2e7d32] cursor-pointer"
                      />
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      <Link href={`/portal/candidates/${candidate.id}`} className="hover:text-[#2e7d32] hover:underline">
                        {candidate.full_name}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div>{candidate.passport_number || candidate.passport_no || 'N/A'}</div>
                      <div className="text-[11px] text-slate-400">{candidate.nationality || candidate.country}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800">{candidate.profession}</span>
                      <div className="text-[11px] text-slate-400 uppercase">{candidate.sector}</div>
                    </td>
                    <td className="p-4">
                      <select
                        value={candidate.assigned_to || staffMembers[0]?.name}
                        onChange={(e) => updateCandidateAssignee(candidate.id, e.target.value)}
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