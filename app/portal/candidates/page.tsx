'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, User, FileText, CheckCircle, Award, Video, ShieldCheck, Clock, Calendar, Save, Languages } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function CandidateDetailPage() {
  const params = useParams();
  const candidateId = params.id as string;

  const [currentLang, setCurrentLang] = useState<Language>('tr');
  const [candidate, setCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [internalNotes, setInternalNotes] = useState('');
  const [status, setStatus] = useState('pending');
  const [isVerified, setIsVerified] = useState(false);

  const t = translations[currentLang] || translations.tr;
  const isRtl = currentLang === 'ar';

  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

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
      setInternalNotes(data.notes || '');
      setStatus(data.status || 'pending');
      setIsVerified(data.is_verified || false);
    }
    setLoading(false);
  };

  const handleSaveDetail = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('job_candidates')
      .update({
        notes: internalNotes,
        status: status,
        is_verified: isVerified,
      })
      .eq('id', candidateId);

    setSaving(false);

    if (!error) {
      alert(currentLang === 'tr' ? 'Aday dosyası başarıyla güncellendi!' : 'Candidate dossier updated successfully!');
    } else {
      alert('Hata: ' + error.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold">Aday dosyası yükleniyor...</div>;
  }

  if (!candidate) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-500 font-bold">Aday dosyası bulunamadı.</div>;
  }

  return (
    <div className={`min-h-screen bg-slate-50 p-4 sm:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/portal" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition">
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full w-fit mb-1">
                Aday Dosyası ID: #{candidate.id.substring(0, 8)}
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">{candidate.full_name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex items-center bg-slate-100 rounded-lg px-2.5 py-1.5 border border-slate-200">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select
                value={currentLang}
                onChange={(e) => setCurrentLang(e.target.value as Language)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value={currentLang} className="font-bold">{activeLangObj?.flag} {activeLangObj?.name}</option>
                {selectableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSaveDetail}
              disabled={saving}
              className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sol Kolon: Aday Bilgileri */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Kimlik & Mesleki Özet */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-[#2e7d32]" /> Kimlik & Mesleki Profil
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">Telefon & E-posta</span>
                  <span className="font-bold text-slate-800">{candidate.phone || 'N/A'}</span>
                  <span className="block text-xs text-slate-500">{candidate.email}</span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">Pasaport / Uyruk</span>
                  <span className="font-bold text-slate-800">{candidate.passport_number || 'Belirtilmedi'}</span>
                  <span className="block text-xs text-slate-500">{candidate.nationality}</span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">Sektör & Meslek</span>
                  <span className="font-bold text-slate-800">{candidate.profession}</span>
                  <span className="block text-xs text-slate-500 uppercase">{candidate.sector}</span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">Tecrübe & Ücret Beklentisi</span>
                  <span className="font-bold text-slate-800">{candidate.experience_years} Yıl Tecrübe</span>
                  <span className="block text-xs text-emerald-700 font-semibold">€{candidate.expected_salary || '0'} / ay</span>
                </div>
              </div>
            </div>

            {/* Sertifika ve Değerlendirme Videosu */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Mesleki Sertifika & Çalışma Videosu
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Sertifika Bilgisi</span>
                  {candidate.certificate_no ? (
                    <div>
                      <div className="font-bold text-slate-800">{candidate.certificate_no}</div>
                      <div className="text-xs text-slate-500">Veren Kurum: {candidate.issuing_body || 'N/A'}</div>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">Sertifika yüklenmemiş.</span>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Çalışma Örneği Video</span>
                  {candidate.video_url ? (
                    <a
                      href={candidate.video_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline font-bold"
                    >
                      <Video className="w-4 h-4" /> Videoyu İncele (Yeni Sekme)
                    </a>
                  ) : (
                    <span className="text-slate-400 text-xs">Video bağlantısı eklenmemiş.</span>
                  )}
                </div>
              </div>
            </div>

            {/* PANOVA İç Operasyon Notları */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> PANOVA İç Değerlendirme Notları
              </h3>
              <p className="text-xs text-slate-400">Bu notlar sadece PANOVA operasyon ekibi tarafından görülebilir.</p>

              <textarea
                rows={4}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Adayın mülakat sonucu, dil seviyesi, teknik yeterliliği ile ilgili değerlendirme notları yazın..."
                className="w-full p-4 rounded-xl border border-slate-200 text-slate-900 text-sm focus:ring-2 focus:ring-[#2e7d32] outline-none"
              />
            </div>
          </div>

          {/* Sağ Kolon: Durum & Belge Doğrulama Paneli */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Süreç Durumu */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Aday Süreç Durumu</h3>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Güncel Aşama</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 bg-slate-50 outline-none cursor-pointer"
                >
                  <option value="pending">🟡 Beklemede (Pending)</option>
                  <option value="reviewing">🔵 İncelemede / Sunuldu (Reviewing)</option>
                  <option value="visa_processing">🟣 Vize / Resmi Süreçte (Visa)</option>
                  <option value="approved">🟢 Onaylandı / İşe Başladı (Approved)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2e7d32]"
                  />
                  <span className="text-xs font-bold text-slate-800">Sertifika & Belgeler Doğrulandı</span>
                </label>
              </div>
            </div>

            {/* Başvuru Geçmişi & Zaman Çizelgesi */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Kayıt Geçmişi</h3>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Başvuru Tarihi:</span>
                  <strong className="text-slate-800">{new Date(candidate.created_at).toLocaleDateString()}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Vardiya Uyum:</span>
                  <strong className="text-slate-800">{candidate.shift_suitable ? 'Evet' : 'Hayır'}</strong>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}