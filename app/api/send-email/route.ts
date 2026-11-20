import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { buildCandidateNoticeEmail, buildTaskNoticeEmail } from '@/lib/email/app-messages';
import { emailLocale, noticeMailCopy } from '@/lib/email/email-copy';
import { forwardFromAddress } from '@/lib/email/forward-inbound';
import { supabaseAnonKey, validUrl } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const locale = emailLocale(body.locale);
  const copy = noticeMailCopy[locale];
  const email = String(body.email || '').trim();
  if (!email) {
    return NextResponse.json({ error: copy.missingEmail }, { status: 400 });
  }

  if (!validUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: copy.sendFailed }, { status: 503 });
  }

  const userClient = createClient(validUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: staff } = await userClient.rpc('is_staff');
  if (staff !== true) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: copy.sendFailed }, { status: 500 });
  }

  const title = String(body.title || '').trim();
  const message = title
    ? buildTaskNoticeEmail({
        locale,
        assigneeName: String(body.assigneeName || ''),
        title,
        dueDate: String(body.dueDate || ''),
        backupAssignee: String(body.backupAssignee || ''),
      })
    : buildCandidateNoticeEmail({
        locale,
        candidateName: String(body.candidateName || ''),
        subject: String(body.subject || ''),
        message: String(body.message || ''),
      });

  const resend = new Resend(apiKey);
  try {
    const { data, error } = await resend.emails.send({
      from: forwardFromAddress(),
      to: [email],
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    if (error) {
      console.error('Notification email failed', error.name);
      return NextResponse.json({ error: copy.sendFailed }, { status: 502 });
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Notification email failed', error instanceof Error ? error.name : 'error');
    return NextResponse.json({ error: copy.sendFailed }, { status: 502 });
  }
}
