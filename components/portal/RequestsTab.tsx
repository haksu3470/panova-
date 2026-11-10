'use client';

import { useState } from 'react';
import { Building2, FileText, Link2 } from 'lucide-react';
import Link from 'next/link';
import MatchPanel from './MatchPanel';
import DemoBadge from './DemoBadge';
import DeleteRecordButton from './DeleteRecordButton';
import ListExportBar from './ListExportBar';
import { portalUi } from '@/lib/portal-ui-copy';
import { offerExportRows, requestExportRows, toCsv } from '@/lib/exportLists';
import { displayedRequestSalary } from '@/lib/workforceRequest';
import { releaseCopy } from '@/lib/release-copy';
import { targetStartIsPast } from '@/lib/demandStatus';
import { supabase } from '@/lib/supabase';
import { useSiteLanguage } from '@/lib/site-language';

interface RequestsTabProps {
  jobRequests: any[];
  t: any;
  updateRequestStatus: (id: string, status: string, reason?: string) => void;
  setSelectedDemandDetail: (detail: any) => void;
  isUpperManagement?: boolean;
  onChanged?: () => void;
}

export default function RequestsTab({
  jobRequests,
  t,
  updateRequestStatus,
  setSelectedDemandDetail,
  isUpperManagement = false,
  onChanged,
}: RequestsTabProps) {
  const [matchReq, setMatchReq] = useState<any | null>(null);
  const { currentLang } = useSiteLanguage('en');
  const ui = portalUi[currentLang];
  return (
    <div className="space-y-6">
      {matchReq && <MatchPanel request={matchReq} onClose={() => setMatchReq(null)} />}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">📁 {t.demandFilesTitle}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t.demandFilesSub}</p>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-2">
          <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs border border-emerald-200">
            {t.openRequestsCard}: {jobRequests.filter((row) => !['completed', 'cancelled'].includes(String(row.status || ''))).length}
          </div>
          <ListExportBar
            filename="labour-requests"
            title={t.demandFilesTitle || 'Requests'}
            rows={requestExportRows(jobRequests)}
            labels={{ csv: ui.exportCsv, excel: ui.exportExcel, print: ui.exportPrint, empty: ui.exportEmpty }}
          />
          <button
            type="button"
            onClick={async () => {
              const { data } = await supabase.from('job_offers').select('id, candidate_id, employer_name, position_title, monthly_net_salary, offer_terms, status, start_date, terms_details, is_demo').order('created_at', { ascending: false });
              const rows = offerExportRows(data || []);
              if (!rows.length) {
                window.alert(ui.exportEmpty);
                return;
              }
              const file = new Blob([`\uFEFF${toCsv(rows)}`], { type: 'text/csv;charset=utf-8' });
              const url = URL.createObjectURL(file);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'offers.csv';
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            {ui.offersExport}
          </button>
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
                  <h4 className="font-extrabold text-slate-900 text-base mt-1.5">{req.position_title}<DemoBadge show={req.is_demo} /></h4>
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> {req.employer_name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg block">
                    {req.headcount} {t.personCount}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px] text-muted-foreground">
                <div>📍 {req.city || 'N/A'}, {req.country || 'International'}</div>
                <div>📅 {t.createdDate}: {req.created_at ? req.created_at.substring(0, 10) : '2026-09'}</div>
                <div>🎯 {t.colTargetStart}: {req.target_start_date || '2026-10-15'}</div>
                <div>💰 {t.colSalary}: {displayedRequestSalary(req) || '—'}</div>
                {targetStartIsPast(req.target_start_date) && !['completed', 'cancelled'].includes(String(req.status || '')) ? (
                  <div className="col-span-2 text-amber-800 font-bold">{releaseCopy[currentLang].pastTarget}</div>
                ) : null}
              </div>

              <div className="pt-2 border-t space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">{t.lifecycleStatusLabel}</label>
                <select
                  value={req.status || 'new_request'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'cancelled') {
                      const reason = prompt(ui.cancelPrompt, ui.cancelReasonLabel);
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
                {(req.closed_reason || req.cancellation_reason) && (
                  <p className="text-[10px] text-red-600 font-medium">{ui.cancelReasonLabel} {req.closed_reason || req.cancellation_reason}</p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setMatchReq(req)}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-xl text-xs font-bold transition shadow cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Link2 className="w-4 h-4" /> {ui.matchCandidates}
              </button>
              <Link
                href={`/portal/requests/${req.id}`}
                className="w-full bg-white border hover:bg-slate-50 text-slate-800 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
              >
                📂 {ui.requestInfo}
              </Link>
              <DeleteRecordButton
                table="job_requests"
                id={req.id}
                name={req.position_title || req.id}
                isDemo={req.is_demo}
                allowed={isUpperManagement}
                onDeleted={onChanged}
              />
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