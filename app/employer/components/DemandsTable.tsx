'use client';

import React, { useState } from 'react';

interface DemandsTableProps {
  t: any;
  demands: any[];
  [key: string]: any;
}

export default function DemandsTable({ t, demands }: DemandsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDemands = demands.filter(item => 
    item.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl lg:col-span-2">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h2 className="text-sm font-black text-slate-900">
          {t.empTabRequests || 'Personel Taleplerim'}
        </h2>
        <input
          type="text"
          placeholder={t.searchDemandPlaceholder || 'Talep ara...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-600 uppercase font-bold">
              <th className="p-3.5 rounded-l-xl">{t.colPosSectorTitle || 'POZİSYON / SEKTÖR'}</th>
              <th className="p-3.5">{t.colCriteriaTitle || 'KRİTERLER'}</th>
              <th className="p-3.5">{t.colHeadcountSalaryTitle || 'KİŞİ / MAAŞ'}</th>
              <th className="p-3.5 rounded-r-xl">{t.colStatusTitle || 'DURUM'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDemands.map((item: any) => (
              <tr key={item.id} className="hover:bg-slate-50 transition align-top">
                <td className="p-3.5 font-medium text-slate-900">
                  <div className="font-bold">{item.position}</div>
                  <div className="text-[10px] text-slate-400">{item.sector}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Tarih: {item.date}</div>
                </td>
                <td className="p-3.5 text-slate-700">
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {item.experience && (
                      <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
                        ⏱️ {item.experience}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {Array.isArray(item.certificates) ? item.certificates.join(', ') : item.certificates}
                  </div>
                </td>
                <td className="p-3.5">
                  <div className="font-semibold text-slate-800">{item.headcount} Kişi</div>
                  <div className="text-slate-600 font-medium">{item.salary}</div>
                </td>
                <td className="p-3.5">
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[10px]">
                    {item.status || 'Aktif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}