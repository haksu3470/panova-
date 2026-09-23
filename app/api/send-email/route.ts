import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, subject, message, candidateName, title, assigneeName, dueDate, backupAssignee } = body;

    // 1. Görev Bildirimi Gönderimi
    if (title) {
      if (!email) {
        return NextResponse.json({ error: 'Sorumlu e-posta adresi bulunamadı.' }, { status: 400 });
      }

      const data = await resend.emails.send({
        from: 'PANOVA Portal <onboarding@resend.dev>',
        to: [email],
        subject: `Yeni Görev Atandı: ${title}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #2e7d32; margin-top: 0;">PANOVA Yönetim Portalı - Görev Ataması</h2>
            <p>Merhaba <strong>${assigneeName || 'Ekip Üyesi'}</strong>,</p>
            <p>Sisteme yeni bir görev eklendi ve bu görevin sorumlusu olarak atandınız.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #2e7d32; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #0f172a;">${title}</h3>
              <p style="margin: 5px 0;"><strong>Son Tamamlama Tarihi:</strong> ${dueDate || 'Belirtilmedi'}</p>
              <p style="margin: 5px 0;"><strong>Yedek Sorumlu:</strong> ${backupAssignee || 'Belirtilmedi'}</p>
            </div>

            <p>Lütfen portal üzerinden görevinizi kontrol edip tamamlandığında işaretleyiniz.</p>
            <p style="font-size: 12px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; pt-20">
              PANOVA TARIM DOO - Otomatik Görev Bildirim Sistemi
            </p>
          </div>
        `,
      });
      return NextResponse.json({ success: true, data });
    } 
    
    // 2. Genel / Aday Bildirimi Gönderimi (Mevcut yapı)
    else {
      if (!email) {
        return NextResponse.json({ error: 'E-posta adresi bulunamadı.' }, { status: 400 });
      }

      const data = await resend.emails.send({
        from: 'PANOVA Portal <onboarding@resend.dev>',
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
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}