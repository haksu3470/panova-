'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Home, User, Save, Camera, FileCheck } from 'lucide-react';
import Link from 'next/link';

interface CandidateDocument {
  id: string;
  name: string;
  status: 'pending' | 'uploaded' | 'reviewing' | 'approved' | 'rejected' | 're_requested' | 'expired';
  file_url?: string;
  file_name?: string;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<any | null>(null);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState('pending');
  const [candidatePassword, setCandidatePassword] = useState('123456');
  const [candidatePhoto, setCandidatePhoto] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');

  useEffect(() => {
    fetchCandidateDetail();
  }, [candidateId]);

  const fetchCandidateDetail = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (!error && data) {
      setCandidate(data);
      setStatus(data.status || 'pending');
      setCandidatePassword(data.password || '123456');
      setCandidatePhoto(data.photo_url || '');
      setCandidatePhone(data.phone || '');
      setCandidateEmail(data.email || '');
      
      const defaultDocs: CandidateDocument[] = [
        { id: '1', name: 'Pasaport Taraması', status: data.passport_number ? 'approved' : 'pending' },
        { id: '2', name: 'Mesleki Sertifika / İzin Belgesi', status: 'pending' },
        { id: '3', name: 'Adli Sicil Kaydı (Sabıka Kaydı)', status: 'pending' },
        { id: '4', name: 'Sağlık Raporu / Akciğer Grafisi', status: 'pending' },
      ];
      
      try {
        setDocuments(data.documents_json ? JSON.parse(data.documents_json) : defaultDocs);
      } catch {
        setDocuments(defaultDocs);
      }
    }
    setLoading(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCandidatePhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDetail = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('job_candidates')
      .update({
        status: status,
        password: candidatePassword,
        photo_url: candidatePhoto,
        phone: candidatePhone,
        email: candidateEmail,
        documents_json: JSON.stringify(documents),
      })
      .eq('id', candidateId);

    setSaving(false);

    if (!error) {
      alert('Aday bilgileri, şifre ve fotoğraf başarıyla kaydedildi!');
    } else {
      alert('Hata: ' + error.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold">Yükleniyor...</div>;
  }

  if (!candidate) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-500 font-bold">Aday bulunamadı.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Üst Bar */}
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/portal" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-xs">
              ← Yönetim Paneline Dön
            </Link>
            <div className="flex items-center gap-3">
              {candidatePhoto ? (
                <img src={candidatePhoto} alt="Foto" className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shadow" />
              ) : (
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">
                  {candidate.full_name?.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">{candidate.full_name}</h1>
                <span className="text-xs text-slate-500">ID: #{candidate.id.substring(0, 8)}</span>
              </div>
            </div>
          </div>

          <button onClick={handleSaveDetail} disabled={saving} className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow flex items-center gap-2 cursor-pointer">
            <Save className="w-4 h-4" /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>

        {/* Fotoğraf, İletişim ve Şifre Yönetimi */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-[#2e7d32]" /> Admin: Fotoğraf, İletişim ve Şifre Yönetimi
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border">
            <div className="relative">
              {candidatePhoto ? (
                <img src={candidatePhoto} alt="Profil" className="w-24 h-24 rounded-2xl object-cover border shadow" />
              ) : (
                <div className="w-24 h-24 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-2xl">
                  {candidate.full_name?.charAt(0)}
                </div>
              )}
              <label className="absolute -bottom-2 -right-2 bg-[#2e7d32] text-white p-2 rounded-xl cursor-pointer shadow hover:bg-[#1b5e20] transition" title="Fotoğraf Yükle">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Telefon Numarası (GSM)</label>
                <input type="tel" value={candidatePhone} onChange={(e) => setCandidatePhone(e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border bg-white font-bold text-slate-900 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block">E-Posta</label>
                <input type="email" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border bg-white font-bold text-slate-900 outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Aday Portalı Şifresi</label>
                <input type="text" value={candidatePassword} onChange={(e) => setCandidatePassword(e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border bg-white font-bold text-slate-900 outline-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Süreç Durumu */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b pb-2">Aday Süreç Durumu</h3>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3 rounded-xl border text-sm font-bold bg-slate-50 outline-none cursor-pointer">
            <option value="pending">🟡 Beklemede</option>
            <option value="reviewing">🔵 İncelemede</option>
            <option value="approved">🟢 Onaylandı</option>
          </select>
        </div>

      </div>
    </div>
  );
}