'use client';

import React, { useState, useEffect } from 'react';
import { translations, Language } from '@/lib/dictionary';
import EmployerHeader from '../../components/employer/EmployerHeader';
import DemandForm from '../../components/employer/DemandForm';
import DemandsTable from '../../components/employer/DemandsTable';

export default function EmployerPage() {
  const [lang, setLang] = useState<Language>('tr');
  const t = translations[lang] || translations['tr'];

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Şirket ve Profil State'leri
  const [companyName, setCompanyName] = useState('AKAY EĞİTİM');
  const [contactPerson, setContactPerson] = useState('Hüseyin Aksu');
  const [phone, setPhone] = useState('+38970385792');
  const [country, setCountry] = useState('North Macedonia');
  const [email, setEmail] = useState('huseyinaksu@gmail.com');
  const [password, setPassword] = useState('••••••');
  const [updateMsg, setUpdateMsg] = useState(false);

  const [activeTab, setActiveTab] = useState<'requests' | 'candidates' | 'interviews' | 'selected' | 'travel' | 'employees' | 'support' | 'profile'>('requests');
  
  const [successMsg, setSuccessMsg] = useState(false);

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);

  const [demands, setDemands] = useState([
    { 
      id: 1, 
      sector: 'Tarım ve Hayvancılık', 
      position: 'Ziraat Mühendisi / Bahçe Şefi', 
      headcount: 3, 
      salary: '1.500 € + Konaklama', 
      experience: '3 - 5 Yıl',
      video: true,
      certificates: ['B Sınıfı Sürücü Belgesi', 'Ziraat Fakültesi Diploma'],
      status: 'reviewing', 
      date: '2026-06-12' 
    },
    { 
      id: 2, 
      sector: 'İnşaat ve Yapı', 
      position: 'Şantiye Şefi / Kalıp Ustası', 
      headcount: 5, 
      salary: '2.000 €', 
      experience: '5+ Yıl',
      video: false,
      certificates: ['Usta Öğreticilik / Mesleki Sertifika'],
      status: 'approved', 
      date: '2026-06-15' 
    },
  ]);

  useEffect(() => {
    const savedDemands = localStorage.getItem('panova_employer_demands');
    if (savedDemands) {
      try {
        setDemands(JSON.parse(savedDemands));
      } catch (e) {
        console.error(e);
      }
    }

    const savedProfile = localStorage.getItem('panova_employer_profile');
    if (savedProfile) {
      try {
        const prof = JSON.parse(savedProfile);
        if (prof.companyName) setCompanyName(prof.companyName);
        if (prof.contactPerson) setContactPerson(prof.contactPerson);
        if (prof.phone) setPhone(prof.phone);
        if (prof.country) setCountry(prof.country);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

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

  const handleCreateDemand = (demandData: any) => {
    const allCerts = [...demandData.selectedCertificates];
    if (demandData.customRequirement.trim()) {
      allCerts.push(demandData.customRequirement.trim());
    }

    const newDemand = {
      id: Date.now(),
      sector: demandData.sector,
      position: demandData.position,
      headcount: demandData.headcount,
      salary: demandData.salary || 'Belirtilmedi',
      experience: demandData.experienceYears,
      video: demandData.videoRequired,
      certificates: allCerts,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
    };

    const updatedDemands = [newDemand, ...demands];
    setDemands(updatedDemands);
    localStorage.setItem('panova_employer_demands', JSON.stringify(updatedDemands));

    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 4000);
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
    const profileData = { companyName, contactPerson, phone, country };
    localStorage.setItem('panova_employer_profile', JSON.stringify(profileData));

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
          </div>
        ) : (
          <div className="space-y-6">
            {/* Üst Bar Modülü */}
            <EmployerHeader
              country={country}
              companyName={companyName}
              lang={lang}
              setLang={setLang}
              t={t}
              onNewDemandClick={() => setActiveTab('requests')}
              onLogout={() => {
                setIsLoggedIn(false);
                setPassword('');
              }}
            />

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex justify-between items-center">
                <div>
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">{t.totalDemands || 'TOPLAM TALEPLER'}</div>
                  <div className="text-3xl font-black text-slate-900 mt-1">{demands.length}</div>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl text-lg font-bold">📋</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex justify-between items-center">
                <div>
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">{t.requestedHeadcount || 'TALEP EDİLEN KİŞİ SAYISI'}</div>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    {demands.reduce((acc, curr) => acc + curr.headcount, 0)}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl text-lg font-bold">👥</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex justify-between items-center">
                <div>
                  <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">{t.activeProcesses || 'AKTİF SÜREÇLER'}</div>
                  <div className="text-3xl font-black text-slate-900 mt-1">2</div>
                </div>
                <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl text-lg font-bold">⏳</div>
              </div>
            </div>

            {/* Navigasyon Sekmeleri */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'requests' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                📁 {t.empTabRequests || 'Personel Taleplerim'}
              </button>
              <button
                onClick={() => setActiveTab('candidates')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'candidates' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                👥 {t.empTabCandidates || 'Adaylar / Eşleşmeler'} ({candidatesPool.length})
              </button>
              <button
                onClick={() => setActiveTab('interviews')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'interviews' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                📅 {t.empTabInterviews || 'Mülakatlar'}
              </button>
              <button
                onClick={() => setActiveTab('selected')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'selected' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ⭐ {t.empTabSelected || 'Seçtiğim Adaylar'}
              </button>
              <button
                onClick={() => setActiveTab('travel')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'travel' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ✈️ {t.empTabTravel || 'Seyahat ve Başlangıç'}
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'employees' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                📊 {t.empEmployeesTitle || '30/60/90 Gün Takibi'}
              </button>
              <button
                onClick={() => setActiveTab('support')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'support' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                🛠️ {t.empTabSupport || 'Destek / Bildirim'}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'profile' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ⚙️ {t.empTabProfile || 'Şirket Profili'}
              </button>
            </div>

            {/* İçerik Alanları */}
            {activeTab === 'requests' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Yeni Talep Oluşturma Modülü */}
                <div className="lg:col-span-1">
                  <DemandForm
                    t={t}
                    onSubmitDemand={handleCreateDemand}
                    successMsg={successMsg}
                  />
                </div>

                {/* Talepler Listesi Modülü */}
                <div className="lg:col-span-2">
                  <DemandsTable
                    t={t}
                    demands={demands}
                  />
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'interviews' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
                <h2 className="text-sm font-black text-slate-900 mb-2">{t.empTabInterviews || 'Planlanan Mülakatlar'}</h2>
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center">
                  📅 Henüz planlanmış aktif mülakat randevunuz bulunmamaktadır.
                </div>
              </div>
            )}

            {activeTab === 'selected' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
                <h2 className="text-sm font-black text-slate-900 mb-2">{t.empSelectedTitle || 'Onayladığınız ve İşlemde Olan Adaylar'}</h2>
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
                <h2 className="text-sm font-black text-slate-900 mb-2">{t.empTravelTitle || 'Uçuş, Varış ve Karşılama Bilgileri'}</h2>
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 p-8 rounded-2xl text-center">
                  ✈️ {t.empNoTravel || 'Vize ve biletleme işlemleri tamamlanan personellerin seyahat detayları burada listelenecektir.'}
                </div>
              </div>
            )}

            {activeTab === 'employees' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
                <h2 className="text-sm font-black text-slate-900 mb-2">{t.empEmployeesTitle || '30/60/90 Gün Takibi'}</h2>
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
                <h2 className="text-sm font-black text-slate-900 mb-4">{t.empSupportFormTitle || 'Operasyonel Destek Talebi Aç'}</h2>
                {supportSuccess && (
                  <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-2xl font-medium">
                    ✅ Destek talebiniz PANOVA operasyon ekibine iletildi.
                  </div>
                )}
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.empSupportSubjectLabel || 'Konu / Başlık'}</label>
                    <input
                      type="text"
                      required
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t.empSupportMessageLabel || 'Mesajınız'}</label>
                    <textarea
                      rows={4}
                      required
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <button type="submit" className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs">
                    {t.empSupportSubmitBtn || 'Destek Talebi Gönder'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-xl">
                <h2 className="text-sm font-black text-slate-900 mb-2">{t.profileUpdateTitle || 'Şirket Profili'}</h2>
                {updateMsg && (
                  <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-2xl font-medium">
                    ✅ {t.profileUpdatedSuccess || 'Şirket profili başarıyla güncellendi!'}
                  </div>
                )}
                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">{t.companyNameLabel || 'ŞİRKET UNVANI'} *</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">{t.countryLocationLabel || 'ÜLKE / KONUM'} *</label>
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">{t.phoneLabel || 'TELEFON'} *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl transition text-xs shadow-lg cursor-pointer"
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