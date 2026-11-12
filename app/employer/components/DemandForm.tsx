'use client';

import React, { useState } from 'react';
import { PlusCircle, CheckCircle, Video, Award } from 'lucide-react';
import type { Language } from '@/lib/dictionary';
import { portalUi } from '@/lib/portal-ui-copy';

interface DemandFormProps {
  t: any;
  lang: string;
  onSubmitDemand: (demandData: any) => void;
  successMsg: boolean;
}

export default function DemandForm({ t, lang, onSubmitDemand, successMsg }: DemandFormProps) {
  const ui = portalUi[(lang as Language)] ?? portalUi.en;
  const [sector, setSector] = useState(ui.formSectors[0]?.value || 'agriculture');
  const [position, setPosition] = useState('');
  const [headcount, setHeadcount] = useState(1);
  const [salary, setSalary] = useState('');
  const [experienceYears, setExperienceYears] = useState(ui.formExperience[1]?.value || '3-5');
  const [videoRequired, setVideoRequired] = useState(true);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([ui.certificates[0]?.value].filter(Boolean));

  const toggleCertificate = (cert: string) => {
    if (selectedCertificates.includes(cert)) {
      setSelectedCertificates(selectedCertificates.filter((item) => item !== cert));
    } else {
      setSelectedCertificates([...selectedCertificates, cert]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!position.trim()) return;

    onSubmitDemand({
      sector: ui.formSectors.find((item) => item.value === sector)?.label || sector,
      position,
      headcount,
      salary,
      experienceYears: ui.formExperience.find((item) => item.value === experienceYears)?.label || experienceYears,
      videoRequired,
      selectedCertificates: selectedCertificates.map((id) => ui.certificates.find((item) => item.value === id)?.label || id),
    });

    setPosition('');
    setSalary('');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl">
          <PlusCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900">{t.corporateDemandTitle || ui.positionLabel}</h2>
          <p className="text-xs text-muted-foreground">{t.corporateDemandDesc}</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{ui.demandSuccess}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">{ui.sectorLabel} *</label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full px-3.5 py-3 border border-slate-300 rounded-xl font-bold text-slate-900 bg-slate-50 cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {ui.formSectors.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">{ui.positionLabel} *</label>
          <input
            type="text"
            required
            placeholder={t.positionPlaceholder || ''}
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full px-3.5 py-3 border border-slate-300 rounded-xl font-medium text-slate-900 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">{ui.headcountLabel} *</label>
            <input
              type="number"
              min="1"
              required
              value={headcount}
              onChange={(e) => setHeadcount(Number(e.target.value))}
              className="w-full px-3.5 py-3 border border-slate-300 rounded-xl font-bold text-slate-900 bg-slate-50 outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">{ui.salaryLabel}</label>
            <input
              type="text"
              placeholder={t.salaryPlaceholder || ''}
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full px-3.5 py-3 border border-slate-300 rounded-xl font-medium text-slate-900 bg-slate-50 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">{ui.experienceLabel}</label>
          <select
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            className="w-full px-3.5 py-3 border border-slate-300 rounded-xl font-semibold text-slate-900 bg-slate-50 cursor-pointer outline-none"
          >
            {ui.formExperience.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-emerald-700" /> {ui.videoRequired}
            </span>
            <input
              type="checkbox"
              checked={videoRequired}
              onChange={(e) => setVideoRequired(e.target.checked)}
              className="w-4 h-4 accent-emerald-700 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">{ui.videoRequiredHint}</p>
        </div>

        <div className="space-y-2 pt-2">
          <label className="block font-bold text-slate-700 uppercase flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-700" /> {ui.certsWanted}
          </label>
          <div className="grid grid-cols-1 gap-2">
            {ui.certificates.map((cert) => {
              const isChecked = selectedCertificates.includes(cert.value);
              return (
                <div
                  key={cert.value}
                  onClick={() => toggleCertificate(cert.value)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                    isChecked ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{cert.label}</span>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isChecked ? 'bg-emerald-700 text-white font-bold' : 'border border-slate-300'}`}>
                    {isChecked ? '✓' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 rounded-xl font-bold transition shadow-lg cursor-pointer mt-4"
        >
          {t.submitDemandBtn}
        </button>
      </form>
    </div>
  );
}
