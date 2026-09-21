import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Resend API Key (Ücretsiz hesap açıp alabilirsiniz: resend.com)
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export async function POST(request: Request) {
  try {
    const { email, subject, message, candidateName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'E-posta adresi bulunamadı.' }, { status: 400 });
    }

    const data = await resend.emails.send({
      from: 'PANOVA Portal <onboarding@resend.dev>', // Kendi domaininiz veya Resend test adresi
      to: [email],
      subject: `PANOVA Bildirim: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2e7d32; margin-top: 0;">PANOVA Tarım & Danışmanlık</h2>
          <p>Sayın <strong>${candidateName || 'Adayımız'}</strong>,</p>
          <p>Yönetim panelimizden tarafınıza yeni bir bildirim iletildi:</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2e7d32; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #0f172a;">${subject}</h3>
            <p style="margin: 0; line-height: 1.5;">${message}</p>
          </div>

          <p style="font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; pt-20">
            Bu e-posta PANOVA Portal bildirim sistemi tarafından otomatik olarak gönderilmiştir. Lütfen bu mesaja doğrudan yanıt vermeyiniz.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}