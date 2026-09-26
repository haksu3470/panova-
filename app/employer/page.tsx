'use client';

import React, { useState, useEffect } from 'react';
import { translations, Language } from '@/lib/dictionary';
import EmployerHeader from './components/EmployerHeader';
import DemandForm from './components/DemandForm';
import DemandsTable from './components/DemandsTable';

export default function EmployerPage() {
  const [lang, setLang] = useState<Language>('tr');
  const t = translations[lang] || translations['tr'];

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Şirket ve Profil State'leri
  const [companyName, setCompanyName] = useState('AKAY EĞİTİM');
  const [contactPerson, setContactPerson] = useState('Hüseyin Aksu');
  const [phone, setPhone] = useState('+38970385792');
  const [country, setCountry] = useState('North Macedonia');
  const [email, setEmail] = useState('huseyinaksu@gmail.com');
  const [password, setPassword] = useState('');
  
  const [activeTab, setActiveTab] = useState<'requests' | 'candidates' | 'interviews' | 'selected' | 'travel' | 'employees' | 'support' | 'profile'>('requests');
  const [successMsg, setSuccessMsg] = useState(false);
  const [updateMsg, setUpdateMsg] = useState(false);

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
    }
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
        if (prof.email) setEmail(prof.email);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSubmitAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsLoggedIn(true);
    }
  };

  const handleCreateDemand = (demandData: any) => {
    const newDemand = {
      id: Date.now(),
      sector: demandData.sector,
      position: demandData.position,
      headcount: demandData.headcount,
      salary: demandData.salary || 'Belirtilmedi',
      experience: demandData.experienceYears,
      video: demandData.videoRequired,
      certificates: demandData.selectedCertificates,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
    };

    const updatedDemands = [newDemand, ...demands];
    setDemands(updatedDemands);
    localStorage.setItem('panova_employer_demands', JSON.stringify(updatedDemands));

    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const profileData = { companyName, contactPerson, phone, country, email };
    localStorage.setItem('panova_employer_profile', JSON.stringify(profileData));

    setUpdateMsg(true);
    setTimeout(() => setUpdateMsg(false), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Üst Bar: Oturum durumuna göre butonları dinamik yönetir */}
        <EmployerHeader
          country={country}
          companyName={isLoggedIn ? companyName : 'PANOVA PORTAL'}
          lang={lang}
          setLang={setLang}
          t={t}
          isLoggedIn={isLoggedIn}
          onNewDemandClick={() => setActiveTab('requests')}
          onLogout={() => {
            setIsLoggedIn(false);
            setPassword('');
          }}
        />

        {!isLoggedIn ? (
          <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-2xl p-8 my-8 border border-slate-200">
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
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === 'profile' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                ⚙️ {t.empTabProfile || 'Şirket Profili'}
              </button>
            </div>

            {activeTab === 'requests' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <DemandForm
                    t={t}
                    onSubmitDemand={handleCreateDemand}
                    successMsg={successMsg}
                  />
                </div>
                <div className="lg:col-span-2">
                  <DemandsTable
                    t={t}
                    demands={demands}
                  />
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-xl">
                <h2 className="text-sm font-black text-slate-900 mb-2">{t.profileUpdateTitle || 'Şirket Profili ve Bilgi Güncelleme'}</h2>
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
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">{t.contactPersonLabel || 'YETKİLİ KİŞİ'} *</label>
                      <input
                        type="text"
                        required
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">{t.countryLocationLabel || 'ÜLKE'} *</label>
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs bg-slate-50 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">{t.companyEmailLabel || 'E-POSTA'} *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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