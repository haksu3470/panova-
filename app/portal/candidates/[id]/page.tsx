'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthGuard from '../../../../components/auth/AuthGuard';
import { translations, Language } from '../../../../lib/dictionary';

function CandidateDetailPageInner() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params?.id;

  // Sözlük nesnesi güvenli tanımlama
  const t = translations?.tr || {};

  const [loading, setLoading] = useState(true);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  // 3'lü Video Alanı State'leri
  const [videoUrl1, setVideoUrl1] = useState('');
  const [videoUrl2, setVideoUrl2] = useState('');
  const [videoUrl3, setVideoUrl3] = useState('');

  // Sağ Panel Takip Alanı State'leri
  const [controlDate, setControlDate] = useState('');
  const [complianceScore, setComplianceScore] = useState('');
  const [salaryMatch, setSalaryMatch] = useState(false);
  const [accommodationMatch, setAccommodationMatch] = useState(false);
  const [employerFeedback, setEmployerFeedback] = useState('');
  const [workerFeedback, setWorkerFeedback] = useState('');
  const [panovaNote, setPanovaNote] = useState('');

  useEffect(() => {
    if (candidateId) {
      setLoading(false);
    }
  }, [candidateId]);

  const handleSaveTracking = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Başarıyla Kaydedildi');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Aday Detayı</h1>
          <p className="text-xs text-slate-500">ID: {candidateId}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          ← Geri Dön
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol ve Orta Sütun: Belgeler ve 3'lü YouTube Videoları */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
            <h2 className="text-sm font-extrabold text-emerald-800 uppercase">
              📹 Kurumsal YouTube Videoları
            </h2>
            
            {/* 1. Video */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">1. Video: Genel Tanıtım</label>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={videoUrl1}
                  onChange={(e) => setVideoUrl1(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 font-medium text-slate-800 text-xs focus:bg-white transition"
                />
                {videoUrl1 && (
                  <button
                    type="button"
                    onClick={() => setPreviewVideo(videoUrl1)}
                    className="bg-emerald-100 text-[#2e7d32] px-3 py-2 rounded-xl font-bold text-[11px] hover:bg-emerald-200 transition shrink-0 cursor-pointer"
                  >
                    Önizle
                  </button>
                )}
              </div>
            </div>

            {/* 2. Video */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">2. Video: Mesleki Beceri</label>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={videoUrl2}
                  onChange={(e) => setVideoUrl2(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 font-medium text-slate-800 text-xs focus:bg-white transition"
                />
                {videoUrl2 && (
                  <button
                    type="button"
                    onClick={() => setPreviewVideo(videoUrl2)}
                    className="bg-emerald-100 text-[#2e7d32] px-3 py-2 rounded-xl font-bold text-[11px] hover:bg-emerald-200 transition shrink-0 cursor-pointer"
                  >
                    Önizle
                  </button>
                )}
              </div>
            </div>

            {/* 3. Video */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">3. Video: Saha Mülakatı</label>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={videoUrl3}
                  onChange={(e) => setVideoUrl3(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 font-medium text-slate-800 text-xs focus:bg-white transition"
                />
                {videoUrl3 && (
                  <button
                    type="button"
                    onClick={() => setPreviewVideo(videoUrl3)}
                    className="bg-emerald-100 text-[#2e7d32] px-3 py-2 rounded-xl font-bold text-[11px] hover:bg-emerald-200 transition shrink-0 cursor-pointer"
                  >
                    Önizle
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Sütun: Takip, Kontrol ve Not Paneli */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase">
              30-60-90 Gün Takip
            </h2>

            <form onSubmit={handleSaveTracking} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Kontrol Tarihi</label>
                <input
                  type="date"
                  value={controlDate}
                  onChange={(e) => setControlDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Uyum Puanı (1-5)</label>
                <select
                  value={complianceScore}
                  onChange={(e) => setComplianceScore(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium bg-white"
                >
                  <option value="">Seçiniz...</option>
                  <option value="1">1 - Çok Zayıf</option>
                  <option value="2">2 - Zayıf</option>
                  <option value="3">3 - Orta</option>
                  <option value="4">4 - İyi</option>
                  <option value="5">5 - Mükemmel</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={salaryMatch}
                    onChange={(e) => setSalaryMatch(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Maaş sözleşmeye uygun
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accommodationMatch}
                    onChange={(e) => setAccommodationMatch(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Konaklama uygun
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">İşveren Geri Bildirimi</label>
                <textarea
                  value={employerFeedback}
                  onChange={(e) => setEmployerFeedback(e.target.value)}
                  placeholder="İşveren görüşü..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Çalışan Geri Bildirimi</label>
                <textarea
                  value={workerFeedback}
                  onChange={(e) => setWorkerFeedback(e.target.value)}
                  placeholder="Çalışan görüşü..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Not</label>
                <textarea
                  value={panovaNote}
                  onChange={(e) => setPanovaNote(e.target.value)}
                  placeholder="Panova notu..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#2e7d32] hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
              >
                Kaydet / Güncelle
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Video Önizleme Modalı */}
      {previewVideo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded-3xl max-w-3xl w-full space-y-3 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Aday Çalışma Videosu Önizlemesi</h3>
              <button
                onClick={() => setPreviewVideo(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-bold transition cursor-pointer"
              >
                ✕ Kapat
              </button>
            </div>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center">
              <iframe
                src={previewVideo.replace('watch?v=', 'embed/')}
                title="Video Önizleme"
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CandidateDetailPage() {
  return (
    <AuthGuard role="staff">
      <CandidateDetailPageInner />
    </AuthGuard>
  );
}