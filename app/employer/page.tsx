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

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('North Macedonia');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  
  const [activeTab, setActiveTab] = useState<
    'home' | 'requests' | 'candidates' | 'interviews' | 'selected' | 'documents' | 'travel' | 'employees' | 'support' | 'profile'
  >('home');

  const [successMsg, setSuccessMsg] = useState(false);
  const [updateMsg, setUpdateMsg] = useState(false);

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
        if (prof.companyLogo) setCompanyLogo(prof.companyLogo);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSubmitAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsLoggedIn(true);
      if (!companyName) setCompanyName('AKAY EĞİTİM');
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
    const profileData = { companyName, contactPerson, phone, country, email, companyLogo };
    localStorage.setItem('panova_employer_profile', JSON.stringify(profileData));

    setUpdateMsg(true);
    setTimeout(() => setUpdateMsg(false), 4000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject || !supportMessage) return;
    setSupportSuccess(true);
    setTimeout(() => setSupportSuccess(false), 4000);
    setSupportSubject('');
    setSupportMessage('');
  };

  const [candidatesPool] = useState([
    { id: 101, name: 'Ahmet Yılmaz', profession: 'Ziraat Mühendisi', experience: '5 Yıl', nationality: 'Türkiye', status: 'Hazır' },
    { id: 102, name: 'Mehmet Demir', profession: 'Bahçe Operatörü', experience: '3 Yıl', nationality: 'Türkiye', status: 'Görüşme Bekliyor' },
  ]);

  const [activeEmployees] = useState([
    { id: 201, name: 'Burak Kaya', position: 'Saha Mühendisi', startDate: '2026-03-01', day30: 'Tamamlandı', day60: 'Devam Ediyor', day90: 'Bekliyor', status: 'Aktif' },
  ]);

  // 4 Dil İçin Tam Sözlük
  const labels = {
    tr: {
      home: '🏠 Ana Sayfa',
      requests: '📁 Personel Taleplerim',
      candidates: '👥 Adaylar',
      interviews: '📅 Görüşmeler',
      selected: '⭐ Seçtiğim Adaylar',
      documents: '📄 Belge ve İşlemler',
      travel: '✈️ Seyahat ve Başlangıç',
      employees: '📊 Aktif Çalışanlar',
      support: '🛠️ Destek / Bildirim',
      profile: '⚙️ Şirket Bilgilerim',
      activeDemands: 'Aktif Talepler',
      presentedCandidates: 'Sunulan Adaylar',
      inProcess: 'İşlemde Olanlar',
      started: 'İşe Başlayanlar',
      supportTitle: 'Operasyonel Destek / Bildirim Aç',
      subjectPlaceholder: 'Konu',
      messagePlaceholder: 'Mesajınız...',
      sendBtn: 'Gönder',
      supportSuccessMsg: 'Destek talebiniz başarıyla alındı.',
      profileTitle: 'Şirket Profili ve Firma Logosu',
      companyLogoLabel: 'Firma Logosu',
      companyNameLabel: 'Şirket Unvanı',
      contactPersonLabel: 'Yetkili Kişi',
      phoneLabel: 'Telefon',
      countryLabel: 'Ülke',
      emailLabel: 'E-Posta',
      saveChangesBtn: 'Değişiklikleri Kaydet',
      profileUpdatedMsg: 'Bilgiler ve logo başarıyla güncellendi!',
      chooseFileBtn: 'Dosya Seç',
      noFileChosen: 'Dosya seçilmedi',
    },
    en: {
      home: '🏠 Home',
      requests: '📁 My Demands',
      candidates: '👥 Candidates',
      interviews: '📅 Interviews',
      selected: '⭐ Selected Candidates',
      documents: '📄 Documents & Status',
      travel: '✈️ Travel & Arrival',
      employees: '📊 Active Employees',
      support: '🛠️ Support / Notice',
      profile: '⚙️ Company Profile',
      activeDemands: 'Active Demands',
      presentedCandidates: 'Presented Candidates',
      inProcess: 'In Process',
      started: 'Started Working',
      supportTitle: 'Open Operational Support / Notice',
      subjectPlaceholder: 'Subject',
      messagePlaceholder: 'Your message...',
      sendBtn: 'Send',
      supportSuccessMsg: 'Your support request has been received.',
      profileTitle: 'Company Profile & Company Logo',
      companyLogoLabel: 'Company Logo',
      companyNameLabel: 'Company Name',
      contactPersonLabel: 'Contact Person',
      phoneLabel: 'Phone',
      countryLabel: 'Country',
      emailLabel: 'Email',
      saveChangesBtn: 'Save Changes',
      profileUpdatedMsg: 'Profile and logo updated successfully!',
      chooseFileBtn: 'Choose File',
      noFileChosen: 'No file chosen',
    },
    sq: {
      home: '🏠 Kryefaqja',
      requests: '📁 Kërkesat e Mia',
      candidates: '👥 Kandidatët',
      interviews: '📅 Intervistat',
      selected: '⭐ Kandidatët e Zgjedhur',
      documents: '📄 Dokumentet',
      travel: '✈️ Udhëtimi',
      employees: '📊 Punonjësit',
      support: '🛠️ Mbështetje',
      profile: '⚙️ Profili i Kompanisë',
      activeDemands: 'Kërkesat Aktive',
      presentedCandidates: 'Kandidatët e Paraqitur',
      inProcess: 'Në Proces',
      started: 'Filluan Punën',
      supportTitle: 'Hap Mbështetje Operacionale',
      subjectPlaceholder: 'Subjekti',
      messagePlaceholder: 'Mesazhi juaj...',
      sendBtn: 'Dërgo',
      supportSuccessMsg: 'Kërkesa juaj u mor me sukses.',
      profileTitle: 'Profili i Kompanisë & Logoja',
      companyLogoLabel: 'Logoja e Kompanisë',
      companyNameLabel: 'Emri i Kompanisë',
      contactPersonLabel: 'Personi i Kontaktit',
      phoneLabel: 'Telefoni',
      countryLabel: 'Shteti',
      emailLabel: 'Email',
      saveChangesBtn: 'Ruaj Ndryshimet',
      profileUpdatedMsg: 'Profili u përditësua me sukses!',
      chooseFileBtn: 'Zgjidh Skedar',
      noFileChosen: 'Asnjë skedar i zgjedhur',
    },
    ar: {
      home: '🏠 الرئيسية',
      requests: '📁 طلباتي',
      candidates: '👥 المرشحون',
      interviews: '📅 المقابلات',
      selected: '⭐ المرشحون المختصرون',
      documents: '📄 المستندات',
      travel: '✈️ السفر',
      employees: '📊 الموظفون النشطون',
      support: '🛠️ الدعم',
      profile: '⚙️ ملف الشركة',
      activeDemands: 'الطلبات النشطة',
      presentedCandidates: 'المرشحون المقدمون',
      inProcess: 'قيد المعالجة',
      started: 'بدأ العمل',
      supportTitle: 'فتح دعم تشغيلي / إشعار',
      subjectPlaceholder: 'الموضوع',
      messagePlaceholder: 'رسالتك...',
      sendBtn: 'إرسال',
      supportSuccessMsg: 'تم استلام طلب الدعم الخاص بك بنجاح.',
      profileTitle: 'ملف الشركة وشعار الشركة',
      companyLogoLabel: 'شعار الشركة',
      companyNameLabel: 'اسم الشركة',
      contactPersonLabel: 'مسؤول الاتصال',
      phoneLabel: 'الهاتف',
      countryLabel: 'الدولة',
      emailLabel: 'البريد الإلكتروني',
      saveChangesBtn: 'حفظ التغييرات',
      profileUpdatedMsg: 'تم تحديث الملف الشخصي والشعار بنجاح!',
      chooseFileBtn: 'اختر ملف',
      noFileChosen: 'لم يتم اختيار ملف',
    },
  };

  const currentLabels = labels[lang] || labels['tr'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        <EmployerHeader
          country={country}
          companyName={isLoggedIn ? companyName : 'PANOVA PORTAL'}
          companyLogo={companyLogo}
          lang={lang}
          setLang={setLang}
          t={t}
          isLoggedIn={isLoggedIn}
          onNewDemandClick={() => setActiveTab('requests')}
          onLogout={() => {
            setIsLoggedIn(false);
            setPassword('');
            setEmail('');
            setCompanyName('');
            setContactPerson('');
            setPhone('');
            setCompanyLogo('');
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
                {lang === 'en' ? 'Sign In' : lang === 'sq' ? 'Kyçu' : lang === 'ar' ? 'تسجيل الدخول' : 'Giriş Yap'}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  authMode === 'signup' ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {lang === 'en' ? 'Sign Up' : lang === 'sq' ? 'Regjistrohuni' : lang === 'ar' ? 'اشتراك' : 'Kayıt Ol'}
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="inline-block p-3 bg-emerald-50 text-emerald-700 rounded-2xl mb-2 text-xl font-bold shadow-sm">
                🏢
              </div>
              <h1 className="text-xl font-black text-slate-900">
                {authMode === 'signup' ? 'İşveren Kaydı' : 'İşveren Giriş Portalı'}
              </h1>
            </div>

            <form onSubmit={handleSubmitAuth} className="space-y-4" autoComplete="off">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">ŞİRKET UNVANI *</label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="Şirket unvanınızı girin"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">YETKİLİ KİŞİ *</label>
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        placeholder="Ad Soyad"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">TELEFON *</label>
                      <input
                        type="tel"
                        required
                        autoComplete="off"
                        placeholder="+389..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">ŞİRKET E-POSTASI *</label>
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="ornek@sirket.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">ŞİFRE *</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl transition text-xs shadow-lg cursor-pointer mt-2"
              >
                {authMode === 'signup' ? 'Kayıt Ol' : 'Giriş Yap'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dile Duyarlı Sekme Navigasyonu */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-xs">
              <button onClick={() => setActiveTab('home')} className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${activeTab === 'home' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>{currentLabels.home}</button>
              <button onClick={() => setActiveTab('requests')} className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${activeTab === 'requests' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>{currentLabels.requests}</button>
              <button onClick={() => setActiveTab('candidates')} className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${activeTab === 'candidates' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>{currentLabels.candidates}</button>
              <button onClick={() => setActiveTab('interviews')} className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${activeTab === 'interviews' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>{currentLabels.interviews}</button>
              <button onClick={() => setActiveTab('selected')} className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${activeTab === 'selected' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>{currentLabels.selected}</button>
              <button onClick={() => setActiveTab('documents')} className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${activeTab === 'documents' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>{currentLabels.documents}</button>
              <button onClick={() => setActiveTab('travel')} className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${activeTab === 'travel' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>{currentLabels.travel}</button>
              <button onClick={() => setActiveTab('employees')} className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${activeTab === 'employees' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>{currentLabels.employees}</button>
              <button onClick={() => setActiveTab('support')} className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${activeTab === 'support' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>{currentLabels.support}</button>
              <button onClick={() => setActiveTab('profile')} className={`px-3 py-2 rounded-xl font-semibold transition cursor-pointer ${activeTab === 'profile' ? 'bg-emerald-700 text-white shadow-md' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`}>{currentLabels.profile}</button>
            </div>

            {activeTab === 'home' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                    <div className="text-[11px] uppercase font-bold text-slate-400">{currentLabels.activeDemands}</div>
                    <div className="text-3xl font-black text-slate-900 mt-1">{demands.length}</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                    <div className="text-[11px] uppercase font-bold text-slate-400">{currentLabels.presentedCandidates}</div>
                    <div className="text-3xl font-black text-slate-900 mt-1">{candidatesPool.length}</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                    <div className="text-[11px] uppercase font-bold text-slate-400">{currentLabels.inProcess}</div>
                    <div className="text-3xl font-black text-slate-900 mt-1">2</div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                    <div className="text-[11px] uppercase font-bold text-slate-400">{currentLabels.started}</div>
                    <div className="text-3xl font-black text-slate-900 mt-1">{activeEmployees.length}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <DemandForm t={t} lang={lang} onSubmitDemand={handleCreateDemand} successMsg={successMsg} />
                </div>
                <div className="lg:col-span-2">
                  <DemandsTable t={t} demands={demands} />
                </div>
              </div>
            )}

            {activeTab === 'candidates' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl">
                <h2 className="text-sm font-black text-slate-900 mb-2">Taleplerinize Sunulan Aday Havuzu</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {candidatesPool.map((c) => (
                    <div key={c.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-600">{c.profession} ({c.experience})</div>
                      <button className="mt-4 w-full bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold">Görüşme İste</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'interviews' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl text-xs text-slate-500 text-center py-12">
                📅 Planlanan veya tamamlanan mülakat randevunuz bulunmamaktadır.
              </div>
            )}

            {activeTab === 'selected' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl text-xs">
                <h2 className="text-sm font-black text-slate-900 mb-2">Onayladığınız Adaylar</h2>
                <p className="text-slate-500">Şu an vize ve sözleşme aşamasında olan onaylı adaylarınız burada listelenir.</p>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl text-xs">
                <h2 className="text-sm font-black text-slate-900 mb-2">Belge ve Genel İşlem Durumları</h2>
                <p className="text-slate-500">Çalışma izni, konsolosluk evrakları ve resmi işlem durum özetleri.</p>
              </div>
            )}

            {activeTab === 'travel' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl text-xs">
                <h2 className="text-sm font-black text-slate-900 mb-2">Seyahat ve İşe Başlangıç</h2>
                <p className="text-slate-500">Uçuş biletleri, varış tarihleri ve havalimanı karşılama detayları.</p>
              </div>
            )}

            {activeTab === 'employees' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl text-xs">
                <h2 className="text-sm font-black text-slate-900 mb-2">Aktif Çalışanlar (30 / 60 / 90 Gün Takibi)</h2>
                <table className="w-full text-left mt-4">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold">
                      <th className="p-3 rounded-l-xl">Personel</th>
                      <th className="p-3">Pozisyon</th>
                      <th className="p-3">30. Gün</th>
                      <th className="p-3">60. Gün</th>
                      <th className="p-3 rounded-r-xl">90. Gün</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeEmployees.map((e) => (
                      <tr key={e.id}>
                        <td className="p-3 font-bold">{e.name}</td>
                        <td className="p-3">{e.position}</td>
                        <td className="p-3 text-emerald-700 font-bold">{e.day30}</td>
                        <td className="p-3 text-amber-700 font-bold">{e.day60}</td>
                        <td className="p-3 text-slate-500 font-bold">{e.day90}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-xl text-xs">
                <h2 className="text-sm font-black text-slate-900 mb-4">{currentLabels.supportTitle}</h2>
                {supportSuccess && <div className="mb-4 bg-emerald-50 text-emerald-800 p-3 rounded-xl">✅ {currentLabels.supportSuccessMsg}</div>}
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <input type="text" placeholder={currentLabels.subjectPlaceholder} value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} required className="w-full p-3 border rounded-xl" />
                  <textarea rows={4} placeholder={currentLabels.messagePlaceholder} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} required className="w-full p-3 border rounded-xl" />
                  <button type="submit" className="bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold cursor-pointer">{currentLabels.sendBtn}</button>
                </form>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-xl text-xs">
                <h2 className="text-sm font-black text-slate-900 mb-2">{currentLabels.profileTitle}</h2>
                {updateMsg && <div className="mb-4 bg-emerald-50 text-emerald-800 p-3 rounded-xl">✅ {currentLabels.profileUpdatedMsg}</div>}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block font-bold mb-1">{currentLabels.companyLogoLabel}</label>
                    <div className="flex items-center gap-4">
                      {companyLogo ? (
                        <img src={companyLogo} alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-lg border border-dashed border-slate-300">🏢</div>
                      )}
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">{currentLabels.companyNameLabel}</label>
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full p-3 border rounded-xl bg-slate-50" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-1">{currentLabels.contactPersonLabel}</label>
                      <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} required className="w-full p-3 border rounded-xl bg-slate-50" />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">{currentLabels.phoneLabel}</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full p-3 border rounded-xl bg-slate-50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-1">{currentLabels.countryLabel}</label>
                      <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} required className="w-full p-3 border rounded-xl bg-slate-50" />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">{currentLabels.emailLabel}</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 border rounded-xl bg-slate-50" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-emerald-700 text-white py-3.5 rounded-xl font-bold cursor-pointer">{currentLabels.saveChangesBtn}</button>
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