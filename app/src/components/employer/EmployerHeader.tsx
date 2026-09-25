'use client';

import React from 'react';
import Link from 'next/link';
import { Language } from '@/lib/dictionary';

interface EmployerHeaderProps {
  country: string;
  companyName: string;
  lang: Language;
  setLang: (lang: Language) => void;
  t: any;
  onNewDemandClick: () => void;
  onLogout: () => void;
}

export default function EmployerHeader({
  country,
  companyName,
  lang,
  setLang,
  t,
  onNewDemandClick,
  onLogout,
}: EmployerHeaderProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider bg-emerald-50 inline-block px-2.5 py-1 rounded-full mb-1">
          {country}
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {companyName}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Language)}
          aria-label="Dil Seçimi"
          className="bg-slate-100 text-slate-800 text-xs rounded-xl px-3 py-2 border border-slate-300 focus:outline-none cursor-pointer font-semibold shadow-sm"
        >
          <option value="tr">🇹🇷 Türkçe</option>
          <option value="en">🇬🇧 English</option>
          <option value="sq">🇦🇱 Shqip</option>
          <option value="ar">🇸🇦 العربية</option>
        </select>

        <Link
          href="/"
          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition font-semibold border border-slate-300 shadow-sm"
        >
          {t.returnHome || 'Ana Sayfa'}
        </Link>

        <button
          onClick={onNewDemandClick}
          className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5"
        >
          <span>+</span> {t.newDemandBtn || 'Yeni Talep Oluştur'}
        </button>

        <button
          onClick={onLogout}
          className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-4 py-2 rounded-xl border border-rose-200 transition cursor-pointer shadow-sm"
        >
          {t.logout || 'Çıkış Yap'}
        </button>
      </div>
    </div>
  );
}