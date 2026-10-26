'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import { AuthFooter } from '@/components/site/AuthFooter';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';

import React, { useState } from 'react';
import { translations } from '@/lib/dictionary';
import { homeCopy } from '@/lib/home-copy';
import { useSiteLanguage } from '@/lib/site-language';
import { company } from '@/lib/company';

function AdminDashboardPageInner() {
  const { currentLang: lang, changeLanguage, isRtl } = useSiteLanguage('tr');
  const t = translations[lang] || translations.tr;
  const a = homeCopy[lang].admin;

  // 14 Yönetim Paneli Sekmesi
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'employers'
    | 'demands'
    | 'candidates'
    | 'matching'
    | 'documents'
    | 'official'
    | 'travel'
    | 'employees'
    | 'followup'
    | 'support'
    | 'reports'
    | 'team'
    | 'settings'
  >('overview');

  // Örnek Veri Setleri (Admin Merkezi)
  const [employers] = useState([
    { id: 1, name: 'AKAY EĞİTİM', contact: 'Hüseyin Aksu', phone: '+38970385792', country: 'North Macedonia', activeDemands: 2, responsible: 'Ahmet Uzman' },
    { id: 2, name: 'PANOVA TARIM DOO', contact: 'Mehmet Çitil', phone: '+389 75 818 697', country: 'North Macedonia', activeDemands: 1, responsible: 'Zeynep Kaya' },
  ]);

  const [demandsList] = useState([
    { id: 101, company: 'AKAY EĞİTİM', position: 'Ziraat Mühendisi', headcount: 3, status: 'İşlemde', responsible: 'Ahmet Uzman' },
    { id: 102, company: 'PANOVA TARIM DOO', position: 'Bahçe Şefi', headcount: 2, status: 'Beklemede', responsible: 'Zeynep Kaya' },
  ]);

  const [candidatesList] = useState([
    { id: 201, name: 'Ahmet Yılmaz', profession: 'Ziraat Mühendisi', country: 'Türkiye', status: 'Hazır', responsible: 'Ahmet Uzman' },
    { id: 202, name: 'Mehmet Demir', profession: 'Bahçe Operatörü', country: 'Türkiye', status: 'Görüşmede', responsible: 'Zeynep Kaya' },
  ]);

  const [tasks, setTasks] = useState([
    { id: 1, title: 'AKAY Eğitim pasaport kontrolünü tamamla', assignee: 'Ahmet Uzman', dueDate: '2026-09-30', status: 'Devam Ediyor' },
    { id: 2, title: 'Panova Tarım işveren sözleşmesini imzalat', assignee: 'Zeynep Kaya', dueDate: '2026-09-28', status: 'Tamamlandı' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className={`min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white font-black p-2.5 rounded-2xl text-sm shadow-md">
            🛡️ PANOVA
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">{a.title}</h1>
            <p className="text-[11px] text-slate-400">{company.shortName} &bull; {a.sub}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher currentLang={lang} onChange={changeLanguage} tone="dark" />
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            {t.returnHome || a.home}
          </button>
        </div>
      </header>

      {/* Navigasyon Sekmeleri */}
      <nav className="bg-slate-800/60 border-b border-slate-700/60 px-6 py-3 overflow-x-auto">
        <div className="flex gap-2 text-xs whitespace-nowrap">
          {([
            ['overview', '📊'], ['employers', '🏢'], ['demands', '📁'], ['candidates', '👥'],
            ['matching', '🔗'], ['documents', '📄'], ['official', '🏛️'], ['travel', '✈️'],
            ['employees', '👷'], ['followup', '📈'], ['support', '🛠️'], ['reports', '📈'],
            ['team', '👥'], ['settings', '⚙️'],
          ] as const).map(([id, icon]) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer ${activeTab === id ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{icon} {a.tabs[id]}</button>
          ))}
        </div>
      </nav>

      {/* Ana İçerik Alanı */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Genel Durum Paneli */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-md">
                <div className="text-xs uppercase font-bold text-slate-400">{a.totalCandidates}</div>
                <div className="text-3xl font-black text-white mt-1">248</div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-md">
                <div className="text-xs uppercase font-bold text-slate-400">{a.activeEmployers}</div>
                <div className="text-3xl font-black text-white mt-1">{employers.length}</div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-md">
                <div className="text-xs uppercase font-bold text-slate-400">{a.openRequests}</div>
                <div className="text-3xl font-black text-emerald-400 mt-1">{demandsList.length}</div>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 shadow-md">
                <div className="text-xs uppercase font-bold text-slate-400">{a.travelReady}</div>
                <div className="text-3xl font-black text-emerald-400 mt-1">12</div>
              </div>
            </div>
          </div>
        )}

        {/* İşverenler */}
        {activeTab === 'employers' && (
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-black text-white">{a.employersTitle}</h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-400 font-bold">
                  <th className="p-3 rounded-l-xl">{a.colCompany}</th>
                  <th className="p-3">{a.colContact}</th>
                  <th className="p-3">{a.colCountry}</th>
                  <th className="p-3">{a.colDemands}</th>
                  <th className="p-3 rounded-r-xl">{a.colOwner}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {employers.map((emp) => (
                  <tr key={emp.id}>
                    <td className="p-3 font-bold text-white">{emp.name}</td>
                    <td className="p-3 text-slate-300">{emp.contact}</td>
                    <td className="p-3 text-slate-300">{emp.country}</td>
                    <td className="p-3 text-emerald-400 font-bold">{emp.activeDemands}</td>
                    <td className="p-3 font-semibold bg-slate-900/40 rounded-r-xl">{emp.responsible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Görevler / Destek Modülü (Sorumlu Atama ve Görev Takibi) */}
        {activeTab === 'support' && (
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black text-white">{a.tasksTitle}</h2>
              <span className="text-xs bg-emerald-600/20 text-emerald-400 px-3 py-1 rounded-full font-bold">Sorumlu: Ahmet Uzman & Yedek: Zeynep Kaya</span>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-slate-400 font-bold">
                  <th className="p-3 rounded-l-xl">{a.colTask}</th>
                  <th className="p-3">{a.colAssignee}</th>
                  <th className="p-3">{a.colDue}</th>
                  <th className="p-3 rounded-r-xl">{a.colStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="p-3 font-bold text-white">{task.title}</td>
                    <td className="p-3 text-slate-300">{task.assignee}</td>
                    <td className="p-3 text-slate-300">{task.dueDate}</td>
                    <td className="p-3 font-bold text-emerald-400">{task.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Diğer sekmeler için placeholder */}
        {['demands', 'candidates', 'matching', 'documents', 'official', 'travel', 'employees', 'followup', 'reports', 'team', 'settings'].includes(activeTab) && activeTab !== 'overview' && activeTab !== 'employers' && activeTab !== 'support' && (
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-12 text-center text-slate-400 shadow-xl">
            <h2 className="text-base font-black text-white mb-2 uppercase tracking-wide">{a.tabs[activeTab]} — {a.moduleOn}</h2>
            <p className="text-xs">{a.moduleDesc}</p>
          </div>
        )}
      </main>

      <AuthFooter tone="dark" />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard role="staff">
      <AdminDashboardPageInner />
    </AuthGuard>
  );
}
