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
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const [companyName, setCompanyName] = useState('AKAY EĞİTİM');
  const [contactPerson, setContactPerson] = useState('Hüseyin Aksu');
  const [phone, setPhone] = useState('+38970385792');
  const [country, setCountry] = useState('North Macedonia');
  const [email, setEmail] = useState('huseyinaksu@gmail.com');
  const [password, setPassword] = useState('••••••');
  
  const [activeTab, setActiveTab] = useState<'requests' | 'candidates' | 'interviews' | 'selected' | 'travel' | 'employees' | 'support' | 'profile'>('requests');
  const [successMsg, setSuccessMsg] = useState(false);

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
      status: 'Inceleniyor', 
      date: '2026-06-12' 
    }
  ]);

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
      status: 'Beklemede',
      date: new Date().toISOString().split('T')[0],
    };

    const updatedDemands = [newDemand, ...demands];
    setDemands(updatedDemands);
    localStorage.setItem('panova_employer_demands', JSON.stringify(updatedDemands));

    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        <EmployerHeader
          country={country}
          companyName={companyName}
          lang={lang}
          setLang={setLang}
          t={t}
          onNewDemandClick={() => setActiveTab('requests')}
          onLogout={() => setIsLoggedIn(false)}
        />

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
      </main>
    </div>
  );
}