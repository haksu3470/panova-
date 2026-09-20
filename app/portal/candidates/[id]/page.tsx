'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, User, Save, Camera, Mail, Phone, KeyRound, FileCheck, FileText, Award, Video, Trash2, Upload, Eye, X, Plus } from 'lucide-react';
import Link from 'next/link';

interface CandidateDocument {
  id: string;
  name: string;
  status: 'pending' | 'uploaded' | 'reviewing' | 'approved' | 'rejected' | 're_requested';
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
  const [internalNotes, setInternalNotes] = useState('');

  // Sertifika & Video
  const [certificateNo, setCertificateNo] = useState('');
  const [issuingBody, setIssuingBody] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Yeni Belge & Önizleme
  const [newDocName, setNewDocName] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);

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
      setInternalNotes(data.notes || '');
      setCertificateNo(data.certificate_no || '');
      setIssuingBody(data.issuing_body || '');
      setVideoUrl(data.video_url || '');

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
        status: status,
        password: candidatePassword,
        photo_url: candidatePhoto,
        phone: candidatePhone,
        email: candidateEmail,
        notes: internalNotes,
        certificate_no: certificateNo,
        issuing_body: issuingBody,
        video_url: videoUrl,
        documents_json: JSON.stringify(documents),
      })
      .eq('id', candidateId);

    setSaving(false);

    if (!error) {
      alert('Aday dosyası, belgeler ve tüm bilgiler başarıyla kaydedildi!');
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
      <div className="max-w-6xl mx-auto space-y-6">
        
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sol Kolon */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Fotoğraf, GSM, E-Posta ve Şifre Yönetimi */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-[#2e7d32]" /> Aday Fotoğraf, GSM, E-Posta ve Şifre Yönetimi
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                      <Phone className="w-3 h-3" /> Telefon Numarası (GSM)
                    </label>
                    <input type="tel" value={candidatePhone} onChange={(e) => setCandidatePhone(e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border bg-white font-bold text-slate-900 outline-none" />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                      <Mail className="w-3 h-3" /> E-Posta Adresi
                    </label>
                    <input type="email" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border bg-white font-bold text-slate-900 outline-none" />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                      <KeyRound className="w-3 h-3" /> Aday Portalı Şifresi
                    </label>
                    <input type="text" value={candidatePassword} onChange={(e) => setCandidatePassword(e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border bg-white font-bold text-slate-900 outline-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div>Pasaport: <strong className="text-slate-800">{candidate.passport_number || 'N/A'}</strong></div>
                <div>Meslek: <strong className="text-slate-800">{candidate.profession}</strong></div>
              </div>
            </div>

            {/* Evrak & Belge Takip Mekanizması */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-600" /> Aday Evrak & Belge Yükleme Mekanizması
                </h3>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg">
                  {documents.filter(d => d.status === 'approved').length} / {documents.length} Onaylı
                </span>
              </div>

              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        <div>
                          <div className="font-extrabold text-slate-900">{doc.name}</div>
                          {doc.file_name && <div className="text-xs text-slate-500">Dosya: {doc.file_name}</div>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={doc.status}
                          onChange={(e) => handleDocStatusChange(doc.id, e.target.value as any)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase cursor-pointer outline-none ${
                            doc.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            doc.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                            'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="pending">🟡 Bekleniyor</option>
                          <option value="uploaded">📤 Yüklendi</option>
                          <option value="reviewing">🔵 İnceleniyor</option>
                          <option value="approved">🟢 Onaylandı</option>
                          <option value="rejected">🔴 Reddedildi</option>
                        </select>

                        <button onClick={() => handleDeleteDocument(doc.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t flex items-center justify-between text-xs">
                      {doc.file_url ? (
                        <button type="button" onClick={() => setPreviewDoc({ name: doc.name, url: doc.file_url! })} className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Önizle
                        </button>
                      ) : <span className="text-slate-400 italic">Dosya yüklenmedi</span>}

                      <label className="bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border font-bold cursor-pointer transition shadow-sm flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" /> Bilgisayardan Yükle
                        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(doc.id, e)} className="hidden" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t flex gap-2">
                <input
                  type="text"
                  placeholder="Yeni Belge Adı (Örn: Ehliyet)"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border text-slate-900 bg-white outline-none"
                />
                <button onClick={handleAddDocument} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                  <Plus className="w-4 h-4" /> Ekle
                </button>
              </div>
            </div>

            {/* Sertifika ve Video */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> Sertifika & Video Yönetimi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase block">Sertifika Bilgileri</span>
                  <input type="text" value={certificateNo} onChange={(e) => setCertificateNo(e.target.value)} placeholder="Sertifika No" className="w-full px-3 py-2 text-xs rounded-lg border bg-white font-bold text-slate-800" />
                  <input type="text" value={issuingBody} onChange={(e) => setIssuingBody(e.target.value)} placeholder="Veren Kurum" className="w-full px-3 py-2 text-xs rounded-lg border bg-white font-bold text-slate-800" />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase block">Çalışma Videosu URL</span>
                  <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className="w-full px-3 py-2 text-xs rounded-lg border bg-white font-bold text-slate-800" />
                </div>
              </div>
            </div>

            {/* Notlar */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> İç Değerlendirme Notları
              </h3>
              <textarea rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} className="w-full p-4 rounded-xl border text-xs outline-none" />
            </div>
          </div>

          {/* Sağ Kolon */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">Aday Süreç Durumu</h3>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-3 rounded-xl border text-sm font-bold bg-slate-50 outline-none cursor-pointer">
                <option value="pending">🟡 Beklemede</option>
                <option value="reviewing">🔵 İncelemede</option>
                <option value="visa_processing">🟣 Vize Sürecinde</option>
                <option value="approved">🟢 Onaylandı</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="p-1.5 bg-slate-800 rounded-full text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex justify-center bg-slate-100">
              <iframe src={previewDoc.url} className="w-full h-[70vh] rounded-xl border" title="Önizleme" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}