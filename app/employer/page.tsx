'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';
import { translations } from '@/lib/dictionary';

export default function EmployerPage() {
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations['tr'];

  // --- State Yönetimi ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'candidates' | 'selected' | 'travel' | 'employees' | 'support' | 'profile'>('requests');

  // Yeni Talep Form State'leri
  const [position, setPosition] = useState('');
  const [headcount, setHeadcount] = useState(1);
  const [sector, setSector] = useState('Tarım ve Hayvancılık');
  const [salary, setSalary] = useState('');
  const [requirements, setRequirements] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  // Destek Talebi State'leri
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Filtreleme ve Arama State'leri
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Örnek Veri Listeleri (Mock Data & State)
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

  const handleLogin = (e: React.FormEvent) => {
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Üst Header */}
      <header className="bg-emerald-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-black tracking-wider text-emerald-300">PANOVA</span>
            <span className="text-xs uppercase bg-emerald-800 text-emerald-200 px-2.5 py-1 rounded font-semibold tracking-wide">
              {t.employerPortal || 'İşveren Portalı'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as any)}
              aria-label="Dil Seçimi / Language Selection"
              className="bg-emerald-800 text-white text-sm rounded px-2.5 py-1.5 border border-emerald-700 focus:outline-none cursor-pointer"
            >
              <option value="tr">🇹🇷 Türkçe</option>
              <option value="en">🇬🇧 English</option>
              <option value="sq">🇦🇱 Shqip</option>
              <option value="ar">🇸🇦 العربية</option>
            </select>

            <Link
              href="/"
              className="text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-3.5 py-2 rounded transition font-medium shadow-sm"
            >
              {t.returnHome || 'Ana Sayfaya Dön'}
            </Link>
          </div>
        </div>
      </header>

      {/* Ana İçerik Alanı */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {!isLoggedIn ? (
          /* Giriş Ekranı */
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mt-16">
            <div className="text-center mb-8">
              <div className="inline-block p-3 bg-emerald-50 text-emerald-700 rounded-full mb-3 text-xl font-bold">
                🏢
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800">
                {t.loginPortalTitle || 'İşveren Giriş Portalı'}
              </h1>
              <p className="text-xs text-slate-500 mt-1.5">
                {t.loginPortalSub || 'Şirket e-postanız ve şifrenizle giriş yapın.'}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  {t.companyEmailLabel || 'Şirket E-Postası'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yonetim@panovatarim.com"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  {t.passwordLabel || 'Şifre'}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition text-sm shadow-md"
              >
                {t.signInBtn || 'Giriş Yap'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400">
              PANOVA TARIM DOO & HR Management System &copy; 2026
            </div>
          </div>
        ) : (
          /* İşveren Yönetim Paneli (Dashboard) */
          <div className="space-y-6">
            {/* Karşılama ve Durum Çubuğu */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-black text-lg">
                  PT
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    PANOVA TARIM DOO &mdash; {email}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Struga, North Macedonia & Akhisar, Türkiye &bull; İş Gücü ve Operasyon Yönetimi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold px-4 py-2 rounded-xl border border-rose-200 transition shadow-sm"
              >
                {t.logout || 'Çıkış Yap'}
              </button>
            </div>

            {/* Navigasyon Sekmeleri */}
            <div className="flex overflow-x-auto space-x-2 border-b border-slate-200 pb-2 scrollbar-none">
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'requests' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                📋 {t.empTabRequests || 'Personel Taleplerim'}
              </button>
              <button
                onClick={() => setActiveTab('candidates')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'candidates' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                👥 {t.empTabCandidates || 'Adaylar / Eşleşmeler'}
              </button>
              <button
                onClick={() => setActiveTab('selected')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'selected' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ⭐ {t.empTabSelected || 'Seçtiğim Adaylar'}
              </button>
              <button
                onClick={() => setActiveTab('travel')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'travel' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ✈️ {t.empTabTravel || 'Seyahat ve Başlangıç'}
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'employees' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                📊 {t.empEmployeesTitle || '30/60/90 Gün Takibi'}
              </button>
              <button
                onClick={() => setActiveTab('support')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'support' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                🛠️ {t.empTabSupport || 'Destek / Bildirim'}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === 'profile' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ⚙️ {t.empTabProfile || 'Şirket Profili'}
              </button>
            </div>

            {/* 1. SEKME: Personel Taleplerim */}
            {activeTab === 'requests' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Talep Oluşturma Formu */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-1">
                  <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>✨</span> {t.newDemandBtn || 'Yeni Talep Oluştur'}
                  </h2>

                  {successMsg && (
                    <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl font-medium animate-pulse">
                      🎉 İş gücü talebiniz sisteme başarıyla kaydedildi!
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
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-md"
                    >
                      {t.submitDossierBtn || 'Talebi Gönder'}
                    </button>
                  </form>
                </div>

                {/* Talepler Listesi Tablosu */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-2">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h2 className="text-base font-bold text-slate-800">
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
                        <tr className="bg-slate-100 text-slate-600 uppercase font-semibold">
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
                            <td className="p-3.5 font-medium text-slate-800">
                              <div className="font-bold">{item.position}</div>
                              <div className="text-[10px] text-slate-400">{item.sector}</div>
                            </td>
                            <td className="p-3.5 font-semibold text-slate-600">{item.headcount} Kişi</td>
                            <td className="p-3.5 text-slate-600">{item.salary}</td>
                            <td className="p-3.5 text-slate-500">{item.date}</td>
                            <td className="p-3.5">
                              {item.status === 'approved' ? (
                                <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-semibold text-[10px]">
                                  {t.approvedStatus || 'Onaylandı'}
                                </span>
                              ) : item.status === 'reviewing' ? (
                                <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-semibold text-[10px]">
                                  {t.reviewingStatus || 'İnceleniyor'}
                                </span>
                              ) : (
                                <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-semibold text-[10px]">
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

            {/* 2. SEKME: Adaylar / Eşleşmeler */}
            {activeTab === 'candidates' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-800 mb-2">
                  {t.empCandidatesPoolTitle || 'Taleplerinize Sunulan Aday Havuzu'}
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                  PANOVA kaynak ülkelerden süzülerek eşleştirilen uygun aday profilleri.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {candidatesPool.map((candidate) => (
                    <div key={candidate.id} className="border border-slate-200 rounded-2xl p-5 bg-slate-50 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-slate-800 text-sm">{candidate.name}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">{candidate.nationality}</span>
                        </div>
                        <div className="text-xs text-slate-600 font-medium">{candidate.profession}</div>
                        <div className="text-[11px] text-slate-400 mt-1">Deneyim: {candidate.experience}</div>
                      </div>
                      <div className="mt-5 pt-3 border-t border-slate-200 flex gap-2">
                        <button className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-2 rounded-xl text-xs font-semibold transition">
                          {t.empInterviewRequestBtn || 'Görüşme İste'}
                        </button>
                        <button className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl text-xs font-semibold transition">
                          {t.empShortlistBtn || 'Kısa Liste'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. SEKME: Seçtiğim Adaylar */}
            {activeTab === 'selected' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-800 mb-2">
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

            {/* 4. SEKME: Seyahat ve Başlangıç */}
            {activeTab === 'travel' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-800 mb-2">
                  {t.empTravelTitle || 'Uçuş, Varış ve Karşılama Bilgileri'}
                </h2>
                <p className="text-xs text-slate-500 mb-6">Uçak biletleme, PNR kodları ve havalimanı transfer detayları.</p>
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center">
                  ✈️ {t.empNoTravel || 'Vize ve biletleme işlemleri tamamlanan personellerin seyahat detayları burada listelenecektir.'}
                </div>
              </div>
            )}

            {/* 5. SEKME: 30 / 60 / 90 Gün Takibi */}
            {activeTab === 'employees' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-800 mb-2">
                  {t.empEmployeesTitle || 'İşe Başlayan Personel ve 30/60/90 Gün Takibi'}
                </h2>
                <p className="text-xs text-slate-500 mb-6">Şirketinizde göreve başlayan personellerin adaptasyon ve performans değerlendirmeleri.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 uppercase font-semibold">
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
                          <td className="p-3.5 font-bold text-slate-800">{emp.name}</td>
                          <td className="p-3.5 text-slate-600">{emp.position}</td>
                          <td className="p-3.5 text-slate-500">{emp.startDate}</td>
                          <td className="p-3.5"><span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">{emp.day30}</span></td>
                          <td className="p-3.5"><span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">{emp.day60}</span></td>
                          <td className="p-3.5"><span className="text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded">{emp.day90}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 6. SEKME: Destek / Bildirim */}
            {activeTab === 'support' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl">
                <h2 className="text-base font-bold text-slate-800 mb-4">
                  {t.empSupportFormTitle || 'Operasyonel Destek Talebi Aç'}
                </h2>

                {supportSuccess && (
                  <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl font-medium">
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
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition shadow-md"
                  >
                    {t.empSupportSubmitBtn || 'Destek Talebi Gönder'}
                  </button>
                </form>
              </div>
            )}

            {/* 7. SEKME: Şirket Profili */}
            {activeTab === 'profile' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-xl">
                <h2 className="text-base font-bold text-slate-800 mb-4">
                  {t.empProfileTitle || 'Firma ve İletişim Bilgilerim'}
                </h2>
                <div className="space-y-4 text-xs bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="font-semibold text-slate-500">Şirket Unvanı:</span>
                    <span className="text-slate-800 font-bold">PANOVA TARIM DOO</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="font-semibold text-slate-500">Faaliyet Alanı:</span>
                    <span className="text-slate-800 font-medium">Tarımsal Üretim, İnşaat ve Ticaret</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="font-semibold text-slate-500">Merkez Konum:</span>
                    <span className="text-slate-800 font-medium">Struga, North Macedonia</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Yetkili E-posta:</span>
                    <span className="text-slate-800 font-medium">{email}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Alt Footer */}
      <footer className="bg-slate-800 text-slate-400 py-6 mt-16 text-center text-xs">
        <p>PANOVA TARIM DOO &bull; International Workforce Management System &copy; 2026</p>
      </footer>
    </div>
  );
}