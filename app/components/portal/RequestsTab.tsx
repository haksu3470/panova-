'use client';

import { Building2, FileText } from 'lucide-react';

interface RequestsTabProps {
  jobRequests: any[];
  t: any;
  updateRequestStatus: (id: string, status: string, reason?: string) => void;
  setSelectedDemandDetail: (detail: any) => void;
}

export default function RequestsTab({
  jobRequests,
  t,
  updateRequestStatus,
  setSelectedDemandDetail
}: RequestsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">📁 {t.demandFilesTitle}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{t.demandFilesSub}</p>
        </div>
        <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs border border-emerald-200">
          {t.openRequestsCard}: {jobRequests.length}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobRequests.map((req) => (
          <div key={req.id} className="bg-white rounded-2xl border p-5 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {req.sector || 'General Sector'}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-base mt-1.5">{req.position_title}</h4>
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> {req.employer_name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg block">
                    {req.headcount} {t.personCount}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px] text-slate-500">
                <div>📍 {req.city || 'N/A'}, {req.country || 'International'}</div>
                <div>📅 {t.createdDate}: {req.created_at ? req.created_at.substring(0, 10) : '2026-09'}</div>
                <div>🎯 {t.colTargetStart}: {req.target_start_date || '2026-10-15'}</div>
                <div>💰 {t.colSalary}: {req.salary || 'Negotiable'}</div>
              </div>

              <div className="pt-2 border-t space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">{t.lifecycleStatusLabel}</label>
                <select
                  value={req.status || 'new_request'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'cancelled') {
                      const reason = prompt('Please enter cancellation reason:', 'Employer cancelled demand');
                      if (reason !== null) {
                        updateRequestStatus(req.id, val, reason);
                      }
                    } else {
                      updateRequestStatus(req.id, val);
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-xl border text-xs font-bold uppercase cursor-pointer outline-none ${
                    req.status === 'completed' ? 'bg-emerald-50 text-emerald-800' :
                    req.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                    'bg-slate-50 text-slate-900'
                  }`}
                >
                  <option value="new_request">🟡 {t.stageNewRequest}</option>
                  <option value="reviewing">🔵 {t.stageReviewing}</option>
                  <option value="searching_candidates">🌍 {t.stageSearchingCandidates}</option>
                  <option value="presenting_candidates">📤 {t.stagePresentingCandidates}</option>
                  <option value="interviews">🤝 {t.stageInterviews}</option>
                  <option value="selection_completed">⭐ {t.stageSelectionCompleted}</option>
                  <option value="official_process">📋 {t.stageOfficialProcess}</option>
                  <option value="travel_planning">✈️ {t.stageTravelPlanning}</option>
                  <option value="completed">🟢 {t.stageCompleted}</option>
                  <option value="cancelled">🔴 {t.stageCancelled}</option>
                </select>
                {req.cancellation_reason && (
                  <p className="text-[10px] text-red-600 font-medium">Cancellation Reason: {req.cancellation_reason}</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-between">
              <button
                onClick={() => setSelectedDemandDetail(req)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-bold transition shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> {t.openDemandFilesBtn}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}