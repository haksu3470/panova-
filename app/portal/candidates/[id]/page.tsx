'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Home, User, FileText, CheckCircle, Award, Video, ShieldCheck, Clock, Calendar, Save, Languages, FileCheck, AlertCircle, Plus, Trash2, Upload, Eye, X, Camera, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

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

  const [currentLang, setCurrentLang] = useState<Language>('tr');
  const [candidate, setCandidate] = useState<any | null>(null);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [internalNotes, setInternalNotes] = useState('');
  const [status, setStatus] = useState('pending');
  const [isVerified, setIsVerified] = useState(false);
  const [candidatePassword, setCandidatePassword] = useState('123456');
  const [candidatePhoto, setCandidatePhoto] = useState<string>('');

  // Sertifika & Video
  const [certificateNo, setCertificateNo] = useState('');
  const [issuingBody, setIssuingBody] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Yeni Belge & Modal
  const [newDocName, setNewDocName] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);

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
      setCertificateNo(data.certificate_no || '');
      setIssuingBody(data.issuing_body || '');
      setVideoUrl(data.video_url || '');
      setCandidatePassword(data.password || '123456');
      setCandidatePhoto(data.photo_url || '');
      
      const defaultDocs: CandidateDocument[] = [
        { id: '1', name: 'Pasaport Taraması', status: data.passport_number ? 'approved' : 'pending' },
        { id: '2', name: 'Mesleki Sertifika / İzin Belgesi', status: data.certificate_no ? 'approved' : 'pending' },
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

  const handleDocStatusChange = (docId: string, newStatus: CandidateDocument['status']) => {
    setDocuments(documents.map(doc => doc.id === docId ? { ...doc, status: newStatus } : doc));
  };

  const handleFileUpload = (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileUrl = e.target?.result as string;
      setDocuments(documents.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            file_url: fileUrl,
            file_name: file.name,
            status: 'uploaded',
          };
        }
        return doc;
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddDocument = () => {
    if (!newDocName.trim()) return;
    const newDoc: CandidateDocument = {
      id: Date.now().toString(),
      name: newDocName,
      status: 'pending',
    };
    setDocuments([...documents, newDoc]);
    setNewDocName('');
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments(documents.filter(d => d.id !== docId));
  };

  const handleSaveDetail = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('job_candidates')
      .update({
        notes: internalNotes,
        status: status,
        is_verified: isVerified,
        certificate_no: certificateNo,
        issuing_body: issuingBody,
        video_url: videoUrl,
        password: candidatePassword,
        photo_url: candidatePhoto,
        documents_json: JSON.stringify(documents),
      })
      .eq('id', candidateId);

    setSaving(false);

    if (!error) {
      alert(currentLang === 'tr' ? 'Aday dosyası, fotoğraf ve şifre başarıyla kaydedildi!' : 'Candidate dossier saved successfully!');
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
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/portal" className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-xs transition border border-slate-200">
              <ArrowLeft className="w-4 h-4 rtl:rotate-180 text-slate-600" />
              <span>Yönetim Paneline Dön</span>
            </Link>

            <Link href="/" className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-xs transition border border-slate-200">
              <Home className="w-4 h-4 text-slate-600" />
              <span>Ana Sayfa</span>
            </Link>

            <div className="border-l border-slate-200 pl-3 ml-1 rtl:border-r rtl:border-l-0 rtl:pr-3 rtl:mr-1 flex items-center gap-3">
              {candidatePhoto ? (
                <img src={candidatePhoto} alt="Aday Fotoğrafı" className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shadow-sm" />
              ) : (
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">
                  {candidate.full_name?.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-800 uppercase bg-emerald-50 px-2 py-0.5 rounded-full w-fit mb-0.5">
                  ID: #{candidate.id.substring(0, 8)}
                </div>
                <h1 className="text-xl font-extrabold text-slate-900">{candidate.full_name}</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDetail}
              disabled={saving}
              className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            
            {/* Fotoğraf ve Kimlik Bilgileri */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-[#2e7d32]" /> Kimlik, Fotoğraf & Portal Şifresi
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="relative group">
                  {candidatePhoto ? (
                    <img src={candidatePhoto} alt="Profil" className="w-24 h-24 rounded-2xl object-cover border shadow-md" />
                  ) : (
                    <div className="w-24 h-24 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-2xl">
                      {candidate.full_name?.charAt(0)}
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-[#2e7d32] text-white p-2 rounded-xl cursor-pointer shadow-lg hover:bg-[#1b5e20] transition" title="Fotoğraf Yükle">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Giriş Telefonu (GSM - Kullanıcı Adı)</label>
                    <input type="text" value={candidate.phone || ''} readOnly className="w-full px-3 py-2 text-xs rounded-lg border bg-slate-100 font-bold text-slate-700" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Aday Portalı Şifresi</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input type="text" value={candidatePassword} onChange={(e) => setCandidatePassword(e.target.value)} placeholder="Şifre belirleyin" className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-white font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#2e7d32]" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-2">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">E-Posta</span>
                  <span className="font-bold text-slate-800">{candidate.email}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">Pasaport No</span>
                  <span className="font-bold text-slate-800">{candidate.passport_number || 'Belirtilmedi'}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">Sektör & Meslek</span>
                  <span className="font-bold text-slate-800">{candidate.profession} ({candidate.sector})</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">Ücret Beklentisi</span>
                  <span className="font-bold text-emerald-700">€{candidate.expected_salary || '0'} / ay</span>
                </div>
              </div>
            </div>

            {/* Evrak Takibi */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" /> Aday Evrak & Belge Yükleme Mekanizması
              </h3>

              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="font-extrabold text-slate-900">{doc.name}</div>
                      <select value={doc.status} onChange={(e) => handleDocStatusChange(doc.id, e.target.value as any)} className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase cursor-pointer outline-none bg-emerald-100 text-emerald-800">
                        <option value="pending">🟡 Bekleniyor</option>
                        <option value="approved">🟢 Onaylandı</option>
                        <option value="rejected">🔴 Reddedildi</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t">
                      {doc.file_url ? (
                        <button type="button" onClick={() => setPreviewDoc({ name: doc.name, url: doc.file_url! })} className="text-emerald-700 font-bold underline cursor-pointer">Önizle</button>
                      ) : <span className="text-slate-400">Dosya yok</span>}
                      <label className="bg-white text-slate-700 px-3 py-1.5 rounded-lg border font-bold cursor-pointer shadow-sm">
                        Dosya Seç
                        <input type="file" onChange={(e) => handleFileUpload(doc.id, e)} className="hidden" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sağ Kolon */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Aday Süreç Durumu</h3>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3 rounded-xl border text-sm font-bold bg-slate-50 outline-none cursor-pointer">
                <option value="pending">🟡 Beklemede</option>
                <option value="reviewing">🔵 İncelemede</option>
                <option value="approved">🟢 Onaylandı</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="p-1.5 bg-slate-800 rounded-full text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex justify-center bg-slate-100">
              <img src={previewDoc.url} alt="Önizleme" className="max-w-full max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}