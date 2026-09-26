'use client';

import React, { useState } from 'react';

interface DemandFormProps {
  t: any;
  onSubmitDemand: (demandData: any) => void;
  successMsg: boolean;
  [key: string]: any;
}

export default function DemandForm({ t, onSubmitDemand, successMsg }: DemandFormProps) {
  const [sector, setSector] = useState('Tarım ve Hayvancılık');
  const [position, setPosition] = useState('');
  const [headcount, setHeadcount] = useState(1);
  const [salary, setSalary] = useState('');
  const [experienceYears, setExperienceYears] = useState('1 - 3 Yıl');
  const [videoRequired, setVideoRequired] = useState(true);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>(['B Sınıfı Sürücü Belgesi']);
  const [customRequirement, setCustomRequirement] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!position.trim()) return;

    onSubmitDemand({
      sector,
      position,
      headcount: Number(headcount),
      salary,
      experienceYears,
      videoRequired,
      selectedCertificates,
      customRequirement,
    });

    setPosition('');
    setHeadcount(1);
    setSalary('');
    setCustomRequirement('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
      <h2 className="text-sm font-black text-slate-900 mb-4">
        {t.newDemandTitle || 'Yeni Personel Talep Et'}
      </h2>

      {successMsg && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-2xl font-medium">
          ✅ {t.demandSuccessMsg || 'Personel talebiniz başarıyla oluşturuldu!'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
            {t.sectorLabel || 'SEKTÖR'} *
          </label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="Tarım ve Hayvancılık">Tarım ve Hayvancılık</option>
            <option value="İnşaat ve Yapı">İnşaat ve Yapı</option>
            <option value="Gıda ve Üretim">Gıda ve Üretim</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
            {t.positionLabel || 'POZİSYON'} *
          </label>
          <input
            type="text"
            required
            placeholder="Örn: Ziraat Mühendisi / Şantiye Şefi"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t.headcountLabel || 'KİŞİ SAYISI'} *
            </label>
            <input
              type="number"
              min={1}
              required
              value={headcount}
              onChange={(e) => setHeadcount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              {t.salaryLabel || 'MAAŞ / ŞARTLAR'}
            </label>
            <input
              type="text"
              placeholder="Örn: 1.500 € + Konaklama"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl transition text-xs shadow-lg cursor-pointer mt-2"
        >
          {t.submitDemandBtn || 'Talep Oluştur'}
        </button>
      </form>
    </div>
  );
}