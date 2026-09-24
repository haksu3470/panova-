'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Building2, Mail, Lock, User, Phone, MapPin, Briefcase, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function EmployerRegisterPage() {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState<Language>('en');

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('North Macedonia');
  const [city, setCity] = useState('Struga');
  const [sector, setSector] = useState('Agriculture');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const t = translations[currentLang] || translations.en;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('employers').insert([
      {
        company_name: companyName,
        contact_person: contactPerson,
        email: email,
        phone: phone,
        country: country,
        city: city,
        sector: sector,
        password: password,
        status: 'active'
      }
    ]);

    setLoading(false);

    if (!error) {
      alert('İşveren kaydınız başarıyla oluşturuldu! Giriş yapabilirsiniz.');
      router.push('/employer');
    } else {
      alert('Kayıt Hatası: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <Link href="/" className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Ana Sayfaya Dön
          </Link>
          <div className="text-xs font-extrabold text-[#2e7d32] bg-emerald-50 px-3 py-1 rounded-xl">
            PANOVA Employer Portal
          </div>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">İşveren Kayıt Formu</h1>
          <p className="text-xs text-slate-500 mt-1">Personel talepleri oluşturmak ve aday havuzuna erişmek için şirketinizi kaydedin.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Şirket Unvanı *</label>
              <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Örn: Panova Tarim DOO" className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Yetkili Kişi *</label>
              <input type="text" required value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Ad Soyad" className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Kurumsal E-Posta *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@panova.com" className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Telefon / GSM *</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+389..." className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Ülke</label>
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Şehir</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Sektör</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium bg-white">
                <option value="Agriculture">Tarım & Hayvancılık</option>
                <option value="Construction">İnşaat</option>
                <option value="Trade">Dış Ticaret & Lojistik</option>
                <option value="HR">İnsan Kaynakları</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Portal Şifresi *</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="******" className="w-full px-3.5 py-2.5 rounded-xl border outline-none font-medium bg-white" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 rounded-xl font-bold transition cursor-pointer shadow-md">
            {loading ? 'Kayıt Yapılıyor...' : 'İşveren Kaydını Tamamla'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t">
          Zaten hesabınız var mı? <Link href="/employer" className="text-[#2e7d32] font-bold hover:underline">Giriş Yapın</Link>
        </div>
      </div>
    </div>
  );
}