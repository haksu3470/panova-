'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Clock, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle, 
  FileCheck 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Applicant {
  id: string;
  name: string;
  role: string;
  country: string;
  visaType: string;
  status: string;
  notes: string;
  updatedAt: string;
}

export default function Dashboard() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'applicants' | 'visas' | 'approvals'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    country: '',
    visaType: 'Çalışma İzni (Type D)',
    status: 'Başvuru Alındı',
    notes: ''
  });

  const [applicants, setApplicants] = useState<Applicant[]>([]);

  // Supabase'den Verileri Çekme (Read from DB)
  const fetchApplicants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Veri çekme hatası:', error.message || error);
    } else if (data) {
      const formattedData: Applicant[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        role: item.role,
        country: item.country,
        visaType: item.visa_type,
        status: item.status,
        notes: item.notes || '',
        updatedAt: item.updated_at
      }));
      setApplicants(formattedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  const totalCount = applicants.length;
  const visaCount = applicants.filter(a => a.status.includes('Vize')).length;
  const pendingCount = applicants.filter(a => a.status === 'Evrak Hazırlığı' || a.status === 'Vize Randevusu Bekliyor').length;
  const completedCount = applicants.filter(a => a.status === 'Vize Onaylandı').length;

  const filteredApplicants = applicants.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.country.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

    if (currentTab === 'visas') return matchesSearch && matchesStatus && a.status.includes('Vize');
    if (currentTab === 'approvals') return matchesSearch && matchesStatus && (a.status === 'Evrak Hazırlığı' || a.status === 'Vize Randevusu Bekliyor');

    return matchesSearch && matchesStatus;
  });

  const handleOpenModal = (applicant?: Applicant) => {
    if (applicant) {
      setEditingId(applicant.id);
      setFormData({
        name: applicant.name,
        role: applicant.role,
        country: applicant.country,
        visaType: applicant.visaType,
        status: applicant.status,
        notes: applicant.notes
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        role: '',
        country: '',
        visaType: 'Çalışma İzni (Type D)',
        status: 'Başvuru Alındı',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  // Supabase'e Veri Ekleme / Güncelleme (Write / Update to DB)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];

    const dbPayload = {
      name: formData.name,
      role: formData.role,
      country: formData.country,
      visa_type: formData.visaType,
      status: formData.status,
      notes: formData.notes,
      updated_at: today
    };

    if (editingId) {
      const { error } = await supabase
        .from('applicants')
        .update(dbPayload)
        .eq('id', editingId);

      if (error) alert('Güncelleme hatası: ' + error.message);
    } else {
      const { error } = await supabase
        .from('applicants')
        .insert([dbPayload]);

      if (error) alert('Ekleme hatası: ' + error.message);
    }

    setIsModalOpen(false);
    fetchApplicants();
  };

  // Supabase'den Veri Silme (Delete from DB)
  const handleDelete = async (id: string) => {
    if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      const { error } = await supabase
        .from('applicants')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Silme hatası: ' + error.message);
      } else {
        fetchApplicants();
      }
    }
  };

  const getBadgeStyle = (status: string) => {
    switch (status) {
      case 'Mülakat Aşaması': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Evrak Hazırlığı': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Vize Randevusu Bekliyor': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Vize Onaylandı': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Reddedildi': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col md:flex-row font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex-shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">
                P
              </div>
              <div>
                <h1 className="text-white font-bold tracking-wide text-lg leading-tight">PANOVA</h1>
                <p className="text-xs text-slate-400">Takip & Yönetim</p>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button 
              onClick={() => setCurrentTab('dashboard')} 
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${currentTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Genel Bakış</span>
            </button>
            <button 
              onClick={() => setCurrentTab('applicants')} 
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${currentTab === 'applicants' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Users className="w-5 h-5" />
              <span>Adaylar & Başvurular</span>
            </button>
            <button 
              onClick={() => setCurrentTab('visas')} 
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${currentTab === 'visas' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <FileText className="w-5 h-5" />
              <span>Vize Süreçleri</span>
            </button>
            <button 
              onClick={() => setCurrentTab('approvals')} 
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${currentTab === 'approvals' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              <Clock className="w-5 h-5" />
              <span>Bekleyen Onaylar</span>
              {pendingCount > 0 && (
                <span className="ml-auto bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full font-semibold border border-amber-500/30">
                  {pendingCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-semibold text-slate-200">
            HA
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">Hüseyin AKSU</p>
            <p className="text-xs text-slate-500 truncate">Yönetici</p>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {currentTab === 'dashboard' && 'Genel Bakış'}
              {currentTab === 'applicants' && 'Adaylar & Başvurular'}
              {currentTab === 'visas' && 'Vize Süreçleri'}
              {currentTab === 'approvals' && 'Bekleyen Onaylar'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">İş başvuruları ve vize süreçlerinin anlık durumu</p>
          </div>
          <button 
            onClick={() => handleOpenModal()} 
            className="inline-flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yeni Başvuru Ekle</span>
          </button>
        </header>

        <div className="p-6 space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-medium text-slate-500">Toplam Başvuru</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalCount}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-medium text-slate-500">Vize Sürecinde</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{visaCount}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><FileCheck className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-medium text-slate-500">Onay Bekleyenler</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{pendingCount}</h3>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-medium text-slate-500">Tamamlananlar</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{completedCount}</h3>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="İsim, pozisyon veya ülke ara..." 
                  className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
              >
                <option value="ALL">Tüm Durumlar</option>
                <option value="Başvuru Alındı">Başvuru Alındı</option>
                <option value="Mülakat Aşaması">Mülakat Aşaması</option>
                <option value="Evrak Hazırlığı">Evrak Hazırlığı</option>
                <option value="Vize Randevusu Bekliyor">Vize Randevusu Bekliyor</option>
                <option value="Vize Onaylandı">Vize Onaylandı</option>
                <option value="Reddedildi">Reddedildi</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-100/70 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Aday</th>
                    <th className="px-6 py-3.5">Pozisyon / Ülke</th>
                    <th className="px-6 py-3.5">Süreç Durumu</th>
                    <th className="px-6 py-3.5">Vize Tipi</th>
                    <th className="px-6 py-3.5">Son Güncelleme</th>
                    <th className="px-6 py-3.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                        Veriler yükleniyor...
                      </td>
                    </tr>
                  ) : filteredApplicants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                        Kayıt bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredApplicants.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-semibold text-slate-900">{item.name}</td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{item.role}</div>
                          <div className="text-xs text-slate-400">{item.country}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeStyle(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">{item.visaType}</td>
                        <td className="px-6 py-4 text-xs text-slate-400">{item.updatedAt}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => handleOpenModal(item)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">{editingId ? 'Aday Kaydını Düzenle' : 'Yeni Aday / Vize Kaydı'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Ad Soyad</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Örn: Ahmet Yılmaz" 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Pozisyon</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Örn: Elektrik Mühendisi" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Hedef Ülke</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Örn: Kuzey Makedonya" 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Vize Tipi</label>
                  <select 
                    value={formData.visaType}
                    onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Çalışma İzni (Type D)">Çalışma İzni (Type D)</option>
                    <option value="Ticari Vize">Ticari Vize</option>
                    <option value="Oturum İzni">Oturum İzni</option>
                    <option value="Turistik">Turistik</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Durum</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Başvuru Alındı">Başvuru Alındı</option>
                    <option value="Mülakat Aşaması">Mülakat Aşaması</option>
                    <option value="Evrak Hazırlığı">Evrak Hazırlığı</option>
                    <option value="Vize Randevusu Bekliyor">Vize Randevusu Bekliyor</option>
                    <option value="Vize Onaylandı">Vize Onaylandı</option>
                    <option value="Reddedildi">Reddedildi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Notlar / Açıklama</label>
                <textarea 
                  rows={3} 
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Evrak durumu veya notlar..." 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}