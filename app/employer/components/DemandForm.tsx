'use client';

import React, { useState } from 'react';
import { PlusCircle, CheckCircle, Video, Award } from 'lucide-react';

interface DemandFormProps {
  t: any;
  lang: string;
  onSubmitDemand: (demandData: any) => void;
  successMsg: boolean;
}

export default function DemandForm({ t, lang, onSubmitDemand, successMsg }: DemandFormProps) {
  const [sector, setSector] = useState('Tarım ve Hayvancılık');
  const [position, setPosition] = useState('');
  const [headcount, setHeadcount] = useState(1);
  const [salary, setSalary] = useState('');
  const [experienceYears, setExperienceYears] = useState('3 - 5 Yıl');
  const [videoRequired, setVideoRequired] = useState(true);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>(['B Sınıfı Sürücü Belgesi']);

  const certificatesList = [
    'B Sınıfı Sürücü Belgesi',
    'Usta Öğreticilik / Mesleki Yeterlilik',
    'Ziraat / Mühendislik Diploması',
    'Kaynakçı Sertifikası (EN ISO)',
    'İnşaat / İş Güvenliği Sertifikası',
    'Uluslararası Seyahat Engeli Yok'
  ];

  const toggleCertificate = (cert: string) => {
    if (selectedCertificates.includes(cert)) {
      setSelectedCertificates(selectedCertificates.filter(c => c !== cert));
    } else {
      setSelectedCertificates([...selectedCertificates, cert]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!position.trim()) return;

    onSubmitDemand({
      sector,
      position,
      headcount,
      salary,
      experienceYears,
      videoRequired,
      selectedCertificates,
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
          <h2 className="text-base font-black text-slate-900">
            {lang === 'en' ? 'New Personnel Demand' : lang === 'sq' ? 'Kërkesë e Re' : lang === 'ar' ? 'طلب موظف جديد' : 'Yeni Personel Talep Et'}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'en' ? 'Specify criteria for workforce recruitment' : 'Personel temini için detaylı kriterler belirleyin'}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Talep başarıyla oluşturuldu ve panele eklendi!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Sektör *</label>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="w-full px-3.5 py-3 border border-slate-300 rounded-xl font-bold text-slate-900 bg-slate-50 cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Tarım ve Hayvancılık">Tarım ve Hayvancılık / Agriculture</option>
            <option value="İnşaat ve Yapı">İnşaat ve Yapı / Construction</option>
            <option value="Turizm ve Otelcilik">Turizm ve Otelcilik / Hospitality</option>
            <option value="Lojistik ve Taşımacılık">Lojistik ve Taşımacılık / Logistics</option>
            <option value="Genel Üretim ve Sanayi">Genel Üretim ve Sanayi / Manufacturing</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Pozisyon / Unvan *</label>
          <input
            type="text"
            required
            placeholder="Örn: Ziraat Mühendisi / Bahçe Şefi"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full px-3.5 py-3 border border-slate-300 rounded-xl font-medium text-slate-900 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Kişi Sayısı *</label>
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
            <label className="block font-bold text-slate-700 uppercase mb-1">Maaş / Şartlar</label>
            <input
              type="text"
              placeholder="Örn: 1.500 € + Konaklama"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full px-3.5 py-3 border border-slate-300 rounded-xl font-medium text-slate-900 bg-slate-50 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase mb-1">Deneyim Süresi</label>
          <select
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            className="w-full px-3.5 py-3 border border-slate-300 rounded-xl font-semibold text-slate-900 bg-slate-50 cursor-pointer outline-none"
          >
            <option value="1 - 2 Yıl">1 - 2 Yıl</option>
            <option value="3 - 5 Yıl">3 - 5 Yıl</option>
            <option value="5 - 10 Yıl">5 - 10 Yıl</option>
            <option value="10+ Yıl Usta">10+ Yıl (Usta)</option>
          </select>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Video className="w-4 h-4 text-emerald-700" /> Zorunlu Video Mülakat
            </span>
            <input
              type="checkbox"
              checked={videoRequired}
              onChange={(e) => setVideoRequired(e.target.checked)}
              className="w-4 h-4 accent-emerald-700 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-500">Adayların başvururken ön mülakat videosu yüklemesi zorunlu olsun.</p>
        </div>

        <div className="space-y-2 pt-2">
          <label className="block font-bold text-slate-700 uppercase flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-700" /> Aranan Belge ve Sertifikalar
          </label>
          <div className="grid grid-cols-1 gap-2">
            {certificatesList.map((cert, idx) => {
              const isChecked = selectedCertificates.includes(cert);
              return (
                <div
                  key={idx}
                  onClick={() => toggleCertificate(cert)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                    isChecked ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{cert}</span>
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
          {lang === 'en' ? 'Create Demand' : lang === 'sq' ? 'Krijo Kërkesën' : lang === 'ar' ? 'إنشاء الطلب' : 'Talep Oluştur'}
        </button>
      </form>
    </div>
  );
}