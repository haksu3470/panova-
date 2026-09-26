'use client';

import React from 'react';
import { Language } from '@/lib/dictionary';

interface EmployerHeaderProps {
  country: string;
  companyName: string;
  lang: Language;
  setLang: (lang: Language) => void;
  t: any;
  isLoggedIn?: boolean;
  onNewDemandClick?: () => void;
  onLogout?: () => void;
}

export default function EmployerHeader({
  country,
  companyName,
  lang,
  setLang,
  t,
  isLoggedIn = false,
  onNewDemandClick,
  onLogout,
}: EmployerHeaderProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
      <div>
        {isLoggedIn && (
          <div className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full inline-block mb-1 uppercase tracking-wider">
            {country}
          </div>
        )}
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          {companyName}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* 4 Resmi Dil Seçeneği */}
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Language)}
          className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="tr">🇹🇷 Türkçe</option>
          <option value="en">🇬🇧 English</option>
          <option value="sq">🇦🇱 Shqip</option>
          <option value="ar">🇸🇦 العربية</option>
        </select>

        {/* Ana Sayfaya Dön Butonu (Dile duyarlı sözlük desteği) */}
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
        >
          {t.returnHomeBtn || (lang === 'en' ? 'Return to Home' : lang === 'sq' ? 'Kthehu në Faqen Kryesore' : lang === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Ana Sayfaya Dön')}
        </button>

        {/* Sadece giriş yapılmışsa görünen butonlar */}
        {isLoggedIn && (
          <>
            {onNewDemandClick && (
              <button
                onClick={onNewDemandClick}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
              >
                + {t.newDemandBtn || (lang === 'en' ? 'New Demand' : lang === 'sq' ? 'Kërkesë e Re' : lang === 'ar' ? 'طلب جديد' : 'Yeni Talep Oluştur')}
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition cursor-pointer border border-rose-200"
              >
                {t.logoutBtn || (lang === 'en' ? 'Sign Out' : lang === 'sq' ? 'Dil' : lang === 'ar' ? 'تسجيل الخروج' : 'Çıkış Yap')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}