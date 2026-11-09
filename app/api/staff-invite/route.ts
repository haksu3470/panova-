import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

import { buildStaffInviteEmail } from '@/lib/email/app-messages';
import { emailLocale } from '@/lib/email/email-copy';
import { forwardFromAddress } from '@/lib/email/forward-inbound';
import { portalUrl } from '@/lib/email/layout';
import { validUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_ANON } from '@/lib/supabase';
const PORTAL_URL = portalUrl();

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 }); }
  const email = String(body?.email || '').trim().toLowerCase();
  const name = String(body?.name || '').trim();
  const role = String(body?.role || '');
  const locale = emailLocale(body?.locale);
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
      : /source_officer_code_missing|referral_code_role/.test(error.message) ? 'Kaynak ülke sorumlusu için yönlendirme kodu atanamadı. Daveti yeniden deneyin.'
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
    const from = forwardFromAddress();
    const message = buildStaffInviteEmail({ locale, name, email, role, portalUrl: PORTAL_URL });
    const { error: sendErr } = await resend.emails.send({
      from,
      to: [email],
      subject: message.subject,
      html: message.html,
      text: message.text,
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
