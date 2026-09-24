'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { translations, Language } from '@/lib/dictionary';

export default function EmployerPage() {
  const [lang, setLang] = useState<Language>('tr');
  const t = translations[lang] || translations['tr'];

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Form State'leri (Ülke alanı state'e bağlanarak kalıcı hale getirildi)
  const [companyName, setCompanyName] = useState('AKAY EĞİTİM');
  const [contactPerson, setContactPerson] = useState('Hüseyin Aksu');
  const [phone, setPhone] = useState('+38970385792');
  const [country, setCountry] = useState('North Macedonia');
  const [email, setEmail] = useState('huseyinaksu@gmail.com');
  const [password, setPassword] = useState('');
  const [updateMsg, setUpdateMsg] = useState(false);

  const [activeTab, setActiveTab] = useState<'requests' | 'candidates' | 'interviews' | 'selected' | 'travel' | 'employees' | 'support' | 'profile'>('profile');
  const [position, setPosition] = useState('');
  const [headcount, setHeadcount] = useState(1);
  const [sector, setSector] = useState('Tarım ve Hayvancılık');
  const [salary, setSalary] = useState('');
  const [requirements, setRequirements] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [demands, setDemands] = useState([
    { id: 1, sector: 'Tarım ve Hayvancılık', position: 'Ziraat Mühendisi / Bahçe Şefi', headcount: 3, salary: '1.500 € + Konaklama', status: 'reviewing', date: '2026-06-12' },
    { id: 2, sector: 'İnşaat ve Yapı', position: 'Şantiye Şefi / Kalıp Ustası', headcount: 5, salary: '2.000 €', status: 'approved', date: '2026-06-15' },
    { id: 3, sector: 'Dış Ticaret ve Lojistik', position: 'İhracat Operasyon Uzmanı', headcount: 2, salary: '1.400 €', status: 'pending', date: '2026-06-20' },
  ]);

  const [candidatesPool] = useState([
    { id: 101, name: 'Ahmet Yılmaz', profession: 'Ziraat Mühendisi', experience: '5 Yıl', nationality: 'Türkiye', status: 'Hazır' },
    { id: 102, name: 'Mehmet Demir', profession: 'Bahçe Operatörü', experience: '3 Yıl', nationality: 'Türkiye', status: 'Görüşme Bekliyor' },
    { id: 103, name: 'Emre Şahin', profession: 'Kalıp Ustası', experience: '8 Yıl', nationality: 'Türkiye', status: 'Vize İşlemde' },
  ]);

  const [activeEmployees] = useState([
    { id: 201, name: 'Burak Kaya', position: 'Saha Mühendisi', startDate: '2026-03-01', day30: 'Tamamlandı', day60: 'Devam Ediyor', day90: 'Bekliyor', status: 'Aktif' },
    { id: 202, name: 'Caner Çelik', position: 'Tekniker', startDate: '2026-04-15', day30: 'Tamamlandı', day60: 'Tamamlandı', day90: 'Devam Ediyor', status: 'Aktif' },
  ]);

  const handleSubmitAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsLoggedIn(true);
    }
  };

  const handleCreateDemand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) return;
    const newDemand = {
      id: Date.now(),
      sector,
      position,
      headcount,
      salary: salary || 'Belirtilmedi',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
    };
    setDemands([newDemand, ...demands]);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 4000);
    setPosition('');
    setSalary('');
    setRequirements('');
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject || !supportMessage) return;
    setSupportSuccess(true);
    setTimeout(() => setSupportSuccess(false), 4000);
    setSupportSubject('');
    setSupportMessage('');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateMsg(true);
    setTimeout(() => setUpdateMsg(false), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {!isLoggedIn ? (
          <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-2xl p-8 my-16 border border-slate-200">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  authMode === 'signin' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.signInBtn || 'Giriş Yap'}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  authMode === 'signup' ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.signUpBtn || 'Kayıt Ol'}
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="inline-block p-3 bg-emerald-50 text-emerald-700 rounded-2xl mb-2 text-xl font-bold shadow-sm">
                🏢
              </div>
              <h1 className="text-xl font-black text-slate-900">
                {authMode === 'signup' ? (t.employerRegTitle || 'İşveren Kaydı') : (t.loginPortalTitle || 'İşveren Giriş Portalı')}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {authMode === 'signup' 
                  ? (t.employerRegSub || 'İş gücü talebi oluşturmak için şirketinizi kaydedin.') 
                  : (t.loginPortalSub || 'Şirket e-postanız ve şifrenizle giriş yapın.')}
              </p>
            </div>

            <form onSubmit={handleSubmitAuth} className="space-y-4" autoComplete="off">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {t.companyNameLabel || 'ŞİRKET UNVANI'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="AKAY EĞİTİM"
                      name="no-autofill-company-name"
                      autoComplete="off"
                      className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        {t.contactPersonLabel || 'YETKİLİ KİŞİ'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="Hüseyin Aksu"
                        name="no-autofill-contact-person"
                        autoComplete="off"
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        {t.phoneLabel || 'TELEFON'} *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+389..."
                        name="no-autofill-phone"
                        autoComplete="off"
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {t.companyEmailLabel || 'ŞİRKET E-POSTASI'} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@akayegitim.com"
                  name="no-autofill-email"
                  autoComplete="off"
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {t.passwordLabel || 'ŞİFRE'} *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  name="no-autofill-password"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl transition text-xs shadow-lg cursor-pointer mt-2"
              >
                {authMode === 'signup' ? (t.completeRegBtn || 'Kayıt Ol') : (t.signInBtn || 'Giriş Yap')}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 font-medium transition">
                &larr; {t.returnHome || 'Ana Sayfaya Dön'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Üst Bar: Şirket Unvanı, Dil Seçimi, Yeni Talep ve Çıkış */}
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
                  aria-label="Dil Seçimi / Language Selection"
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
                  onClick={() => setActiveTab('requests')}
                  className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>+</span> {t.newDemandBtn || 'Yeni Talep Oluştur'}
                </button>

                <button
                  onClick={() => {
                    setIsLoggedIn(false);
                    setPassword('');
                  }}
                  className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-4 py-2 rounded-xl border border-rose-200 transition cursor-pointer shadow-sm"
                >
                  {t.logout || 'Çıkış Yap'}
                </button>
              </div>
            </div>

            {/* Özet İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex justify-between items-center">
                <div>
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    {t.totalDemands || 'TOPLAM TALEPLER'}
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-1">{demands.length}</div>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl text-lg font-bold">📋</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex justify-between items-center">
                <div>
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    {t.requestedHeadcount || 'TALEP EDİLEN KİŞİ SAYISI'}
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    {demands.reduce((acc, curr) => acc + curr.headcount, 0)}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl text-lg font-bold">👥</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex justify-between items-center">
                <div>
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    {t.activeProcesses || 'AKTİF SÜREÇLER'}
                  </div>
                  <div className="text-3xl font-black text-slate-900 mt-1">2</div>
                </div>
                <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl text-lg font-bold">⏳</div>
              </div>
            </div>

            {/* Navigasyon Sekmeleri */}
            <div className="flex overflow-x-auto space-x-2 border-b border-slate-200 pb-2 scrollbar-none">
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'requests' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                📁 {t.empTabRequests || 'Personel Taleplerim'}
              </button>
              <button
                onClick={() => setActiveTab('candidates')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'candidates' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                👥 {t.empTabCandidates || 'Adaylar / Eşleşmeler'} ({candidatesPool.length})
              </button>
              <button
                onClick={() => setActiveTab('interviews')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'interviews' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                📅 {t.empTabInterviews || 'Mülakatlar'}
              </button>
              <button
                onClick={() => setActiveTab('selected')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'selected' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ⭐ {t.empTabSelected || 'Seçtiğim Adaylar'}
              </button>
              <button
                onClick={() => setActiveTab('travel')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'travel' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ✈️ {t.empTabTravel || 'Seyahat ve Başlangıç'}
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'employees' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                📊 {t.empEmployeesTitle || '30/60/90 Gün Takibi'}
              </button>
              <button
                onClick={() => setActiveTab('support')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'support' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                🛠️ {t.empTabSupport || 'Destek / Bildirim'}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeTab === 'profile' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ⚙️ {t.empTabProfile || 'Şirket Profili'}
              </button>
            </div>

            {/* İçerik Alanları */}
            {activeTab === 'requests' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl lg:col-span-1">
                  <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                    <span>✨</span> {t.newDemandBtn || 'Yeni Talep Oluştur'}
                  </h2>

                  {successMsg && (
                    <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-2xl font-medium">
                      🎉 {t.regSuccessTitle || 'Başarılı'}! İş gücü talebiniz sisteme kaydedildi.
                    </div>
                  )}

                  <form onSubmit={handleCreateDemand} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        {t.sectorLabel || 'Sektör'}
                      </label>
                      <select
                        value={sector}
                        onChange={(e) => setSector(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                      >
                        <option value="Tarım ve Hayvancılık">Tarım ve Hayvancılık (Agriculture)</option>
                        <option value="İnşaat ve Yapı">İnşaat ve Yapı (Construction)</option>
                        <option value="Dış Ticaret ve Lojistik">Dış Ticaret ve Lojistik (Trade)</option>
                        <option value="İnsan Kaynakları">İnsan Kaynakları (HR)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        {t.colPosSec || 'Pozisyon'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="Örn: Ziraat Mühendisi / Bahçe Operatörü"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        {t.colHeadcount || 'Kişi Sayısı'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={headcount}
                        onChange={(e) => setHeadcount(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        {t.colSalary || 'Maaş Teklifi'}
                      </label>
                      <input
                        type="text"
                        value={salary}
                        onChange={(e) => setSalary(e.target.value)}
                        placeholder="Örn: 1.200 € + Konaklama"
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        {t.specialReqs || 'Özel Şartlar'}
                      </label>
                      <textarea
                        rows={3}
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        placeholder="Sertifika, tecrübe veya vize durumu..."
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer"
                    >
                      {t.submitDossierBtn || 'Talebi Gönder'}
                    </button>
                  </form>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl lg:col-span-2">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h2 className="text-sm font-black text-slate-900">
                      {t.empTabRequests || 'Personel Taleplerim'}
                    </h2>
                    <input
                      type="text"
                      placeholder="Talep ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 uppercase font-bold">
                          <th className="p-3.5 rounded-l-xl">Sektör / Pozisyon</th>
                          <th className="p-3.5">Kişi</th>
                          <th className="p-3.5">Maaş</th>
                          <th className="p-3.5">Tarih</th>
                          <th className="p-3.5 rounded-r-xl">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {demands.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition">
                            <td className="p-3.5 font-medium text-slate-900">
                              <div className="font-bold">{item.position}</div>
                              <div className="text-[10px] text-slate-400">{item.sector}</div>
                            </td>
                            <td className="p-3.5 font-semibold text-slate-700">{item.headcount} Kişi</td>
                            <td className="p-3.5 text-slate-700">{item.salary}</td>
                            <td className="p-3.5 text-slate-500">{item.date}</td>
                            <td className="p-3.5">
                              {item.status === 'approved' ? (
                                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold text-[10px]">
                                  {t.approvedStatus || 'Onaylandı'}
                                </span>
                              ) : item.status === 'reviewing' ? (
                                <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold text-[10px]">
                                  {t.reviewingStatus || 'İnceleniyor'}
                                </span>
                              ) : (
                                <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-bold text-[10px]">
                                  {t.pendingStatus || 'Beklemede'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'candidates' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
                <h2 className="text-sm font-black text-slate-900 mb-2">
                  {t.empCandidatesPoolTitle || 'Taleplerinize Sunulan Aday Havuzu'}
                </h2>
                <p className="text-xs text-slate-500 mb-6">PANOVA kaynak ülkelerden süzülerek eşleştirilen uygun aday profilleri.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {candidatesPool.map((candidate) => (
                    <div key={candidate.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-slate-900 text-sm">{candidate.name}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">{candidate.nationality}</span>
                        </div>
                        <div className="text-xs text-slate-700 font-medium">{candidate.profession}</div>
                        <div className="text-[11px] text-slate-400 mt-1">Deneyim: {candidate.experience}</div>
                      </div>
                      <div className="mt-5 pt-3 border-t border-slate-200 flex gap-2">
                        <button className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
                          {t.empInterviewRequestBtn || 'Görüşme İste'}
                        </button>
                        <button className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
                          {t.empShortlistBtn || 'Kısa Liste'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'interviews' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
                <h2 className="text-sm font-black text-slate-900 mb-2">
                  {t.empTabInterviews || 'Planlanan Mülakatlar'}
                </h2>
                <p className="text-xs text-slate-500 mb-6">Adaylarla gerçekleştirilecek online veya yüz yüze mülakat takvimi.</p>
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center">
                  📅 Henüz planlanmış aktif mülakat randevunuz bulunmamaktadır.
                </div>
              </div>
            )}

            {activeTab === 'selected' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
                <h2 className="text-sm font-black text-slate-900 mb-2">
                  {t.empSelectedTitle || 'Onayladığınız ve İşlemde Olan Adaylar'}
                </h2>
                <p className="text-xs text-slate-500 mb-6">Mülakatları tamamlanan ve sözleşme/vize aşamasındaki personel adayları.</p>
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-center justify-between">
                  <div className="text-xs text-emerald-900 font-medium">
                    ✨ Şu an vize işlemlerinde olan <strong className="font-bold">2 adet</strong> onaylı adayınız bulunmaktadır.
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-white px-3 py-1 rounded-xl shadow-sm">Aktif Süreç</span>
                </div>
              </div>
            )}

            {activeTab === 'travel' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
                <h2 className="text-sm font-black text-slate-900 mb-2">
                  {t.empTravelTitle || 'Uçuş, Varış ve Karşılama Bilgileri'}
                </h2>
                <p className="text-xs text-slate-500 mb-6">Uçak biletleme, PNR kodları ve havalimanı transfer detayları.</p>
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center">
                  ✈️ {t.empNoTravel || 'Vize ve biletleme işlemleri tamamlanan personellerin seyahat detayları burada listelenecektir.'}
                </div>
              </div>
            )}

            {activeTab === 'employees' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
                <h2 className="text-sm font-black text-slate-900 mb-2">
                  {t.empEmployeesTitle || 'İşe Başlayan Personel ve 30/60/90 Gün Takibi'}
                </h2>
                <p className="text-xs text-slate-500 mb-6">Şirketinizde göreve başlayan personellerin adaptasyon ve performans değerlendirmeleri.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 uppercase font-bold">
                        <th className="p-3.5 rounded-l-xl">Personel</th>
                        <th className="p-3.5">Pozisyon</th>
                        <th className="p-3.5">İşe Başlama</th>
                        <th className="p-3.5">30. Gün</th>
                        <th className="p-3.5">60. Gün</th>
                        <th className="p-3.5 rounded-r-xl">90. Gün</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 font-bold text-slate-900">{emp.name}</td>
                          <td className="p-3.5 text-slate-700">{emp.position}</td>
                          <td className="p-3.5 text-slate-500">{emp.startDate}</td>
                          <td className="p-3.5"><span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">{emp.day30}</span></td>
                          <td className="p-3.5"><span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">{emp.day60}</span></td>
                          <td className="p-3.5"><span className="text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">{emp.day90}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-2xl">
                <h2 className="text-sm font-black text-slate-900 mb-4">
                  {t.empSupportFormTitle || 'Operasyonel Destek Talebi Aç'}
                </h2>

                {supportSuccess && (
                  <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-2xl font-medium">
                    ✅ Destek talebiniz PANOVA operasyon ekibine iletildi. En kısa sürede dönüş yapılacaktır.
                  </div>
                )}

                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {t.empSupportSubjectLabel || 'Konu / Başlık'}
                    </label>
                    <input
                      type="text"
                      required
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      placeholder="Örn: Konaklama Düzenlemesi Hakkında"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      {t.empSupportMessageLabel || 'Mesajınız'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Detaylı talebinizi yazın..."
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer"
                  >
                    {t.empSupportSubmitBtn || 'Destek Talebi Gönder'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-xl">
                <h2 className="text-sm font-black text-slate-900 mb-2">
                  {t.profileUpdateTitle || 'Şirket Profili ve Bilgi Güncelleme'}
                </h2>
                <p className="text-xs text-slate-500 mb-6">{t.profileUpdateDesc || 'Şirket bilgilerinizi ve şifrenizi buradan güncelleyebilirsiniz.'}</p>

                {updateMsg && (
                  <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-2xl font-medium">
                    ✅ {t.profileUpdatedSuccess || 'Şirket profili başarıyla güncellendi!'}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {t.companyNameLabel || 'ŞİRKET UNVANI'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        {t.contactPersonLabel || 'YETKİLİ KİŞİ'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        {t.phoneLabel || 'TELEFON'} *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        {t.countryLocationLabel || 'ÜLKE / KONUM'} *
                      </label>
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                        {t.passwordLabel || 'ŞİFRE'} *
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                      {t.emailImmutableLabel || 'E-POSTA (DEĞİŞTİRİLEMEZ)'}
                    </label>
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-xs bg-slate-100 text-slate-500 cursor-not-allowed font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl transition text-xs shadow-lg cursor-pointer mt-2"
                  >
                    {t.saveChangesBtn || 'Değişiklikleri Kaydet'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-slate-50 text-slate-400 py-6 text-center text-xs border-t border-slate-200">
        <p>PANOVA TARIM DOO &bull; International Workforce Management System &copy; 2026</p>
      </footer>
    </div>
  );
}