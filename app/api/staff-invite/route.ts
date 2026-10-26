import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

import { validUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_ANON } from '@/lib/supabase';
const PORTAL_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://panova-xi.vercel.app') + '/portal';

const ROLE_TR: Record<string, string> = {
  upper_management: 'Üst Yönetim',
  source_country: 'Kaynak Ülke Sorumlusu',
  target_country: 'Hedef Ülke Sorumlusu',
  field_officer: 'Saha Görevlisi',
  finance: 'Finans',
  limited: 'Sınırlı Erişim',
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 }); }
  const email = String(body?.email || '').trim().toLowerCase();
  const name = String(body?.name || '').trim();
  const role = String(body?.role || '');
  if (!email) return NextResponse.json({ error: 'E-posta zorunludur.' }, { status: 400 });

  // Kullanıcının kendi oturumuyla RPC çağrılır; yetki kontrolü veritabanında (invite_staff) yapılır.
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: staff, error } = await sb.rpc('invite_staff', { p_email: email, p_name: name, p_staff_role: role });
  if (error) {
    const msg = /upper_management/.test(error.message) ? 'Bu işlem için Üst Yönetim yetkisi gereklidir.'
      : /already active/.test(error.message) ? 'Bu e-posta zaten aktif bir personel hesabına bağlı.'
      : /Invalid email/.test(error.message) ? 'Geçersiz e-posta adresi.'
      : /Invalid staff_role/.test(error.message) ? 'Geçersiz rol.'
      : 'Davet kaydedilemedi: ' + error.message;
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({
      success: true, emailSent: false, staff,
      warning: `Personel kaydı oluşturuldu ancak e-posta gönderilemedi: RESEND_API_KEY tanımlı değil. Personele ${PORTAL_URL} adresini kendiniz iletin.`,
    });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM || 'PANOVA Portal <onboarding@resend.dev>';
    const roleTr = ROLE_TR[role] || role;
    const { error: sendErr } = await resend.emails.send({
      from, to: [email],
      subject: 'PANOVA Yönetim Portalı davetiniz',
      html: `
<div style="font-family:Arial,sans-serif;padding:20px;color:#333;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px">
  <h2 style="color:#2e7d32;margin-top:0">PANOVA Yönetim Portalı'na davet edildiniz</h2>
  <p>Merhaba <strong>${esc(name || email)}</strong>,</p>
  <p>PANOVA ekibine <strong>${esc(roleTr)}</strong> rolüyle eklendiniz.</p>
  <p>Hesabınızı etkinleştirmek için aşağıdaki bağlantıya gidin ve <strong>bu e-posta adresiyle (${esc(email)})</strong>
     Google ile giriş yapın veya e-posta + şifre ile kayıt olun. Google dışı (ve şifreyle açılan Gmail) hesaplar, portala girmeden önce e-postadaki doğrulamayı tamamlamalıdır. Farklı bir adres kullanırsanız hesabınız bağlanamaz.</p>
  <p style="text-align:center;margin:28px 0">
    <a href="${PORTAL_URL}" style="background:#2e7d32;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Portala Git</a>
  </p>
  <p style="font-size:12px;color:#64748b">${PORTAL_URL}</p>
  <p style="font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:12px">Bu daveti beklemiyorsanız e-postayı yok sayabilirsiniz.</p>
</div>`,
    });
    if (sendErr) throw new Error(sendErr.message);
    return NextResponse.json({ success: true, emailSent: true, staff });
  } catch (e: any) {
    return NextResponse.json({
      success: true, emailSent: false, staff,
      warning: `Personel kaydı oluşturuldu ancak davet e-postası gönderilemedi (${e.message}). Personele ${PORTAL_URL} adresini kendiniz iletin.`,
    });
  }
}
