'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, UserCheck, ShieldCheck, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function PortalPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Login Kontrolü
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'panova2026') {
      setAuthenticated(true);
      fetchCandidates();
    } else {
      alert('Hatalı kullanıcı adı veya şifre! (Invalid credentials)');
    }
  };

  // Aday Listesini Çekme
  const fetchCandidates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCandidates(data);
    }
    setLoading(false);
  };

  // Vize / Başvuru Durumunu Güncelleme
  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('job_candidates')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setCandidates(candidates.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } else {
      alert('Güncelleme hatası: ' + error.message);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.passport_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.profession?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-14 h-14 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">PANOVA PORTAL</h1>
          <p className="text-slate-500 text-sm mb-6">Admin & Employer Access / Portal Girişi</p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Username / Kullanıcı Adı</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2e7d32] outline-none"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password / Şifre</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#2e7d32] outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-lg mt-2"
            >
              Sign In / Giriş Yap
            </button>
          </form>
          <Link href="/" className="inline-block mt-6 text-sm text-slate-500 hover:underline">
            ← Back to Home Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
              <ShieldCheck className="w-4 h-4" /> Authenticated System
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">Candidate & Visa Management Portal</h1>
          </div>
          <button
            onClick={() => setAuthenticated(false)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            Logout / Çıkış
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search candidate, passport or profession..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-[#2e7d32]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="all">All Statuses / Tüm Durumlar</option>
              <option value="pending">Pending (Beklemede)</option>
              <option value="reviewing">Reviewing (İnceleniyor)</option>
              <option value="visa_processing">Visa Processing (Vize Sürecinde)</option>
              <option value="approved">Approved (Vize Onaylandı)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Passport / Nationality</th>
                    <th className="p-4">Profession & Sector</th>
                    <th className="p-4">Phone / Contact</th>
                    <th className="p-4">Visa Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">{candidate.full_name}</td>
                      <td className="p-4">
                        <div>{candidate.passport_number || 'N/A'}</div>
                        <div className="text-xs text-slate-400">{candidate.nationality}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-800">{candidate.profession}</span>
                        <div className="text-xs text-slate-400 uppercase">{candidate.sector}</div>
                      </td>
                      <td className="p-4">{candidate.phone}</td>
                      <td className="p-4">
                        <select
                          value={candidate.status || 'pending'}
                          onChange={(e) => updateStatus(candidate.id, e.target.value)}
                          className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase cursor-pointer outline-none bg-slate-50"
                        >
                          <option value="pending">🟡 Pending</option>
                          <option value="reviewing">🔵 Reviewing</option>
                          <option value="visa_processing">🟣 Visa Processing</option>
                          <option value="approved">🟢 Approved</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {filteredCandidates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No candidate records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
