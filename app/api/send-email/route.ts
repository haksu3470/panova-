import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { buildCandidateNoticeEmail } from '@/lib/email/app-messages';
import { emailLocale, noticeMailCopy } from '@/lib/email/email-copy';
import { forwardFromAddress } from '@/lib/email/forward-inbound';
import { supabaseAnonKey, validUrl } from '@/lib/supabase';

export const runtime = 'nodejs';

// shortcut: per-instance memory, resets on cold start; move to a DB counter if abuse shows up.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_STAFF = 30;
const sent = new Map<string, number[]>();

function tooMany(userId: string): boolean {
  const now = Date.now();
  const recent = (sent.get(userId) ?? []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  sent.set(userId, recent);
  return recent.length > MAX_PER_STAFF;
}

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
  const candidateId = String(body.candidateId || '').trim();
  const subject = String(body.subject || '').trim();
  const text = String(body.message || '').trim();
  if (!candidateId || subject.length > 200 || text.length > 4000) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
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

  const { data: auth } = await userClient.auth.getUser(token);
  if (!auth.user || tooMany(auth.user.id)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // The recipient comes from the DB under the staff member's RLS scope, never from the request.
  const { data: candidate } = await userClient
    .from('job_candidates')
    .select('email, full_name')
    .eq('id', candidateId)
    .maybeSingle();
  const email = String(candidate?.email || '').trim();
  if (!email) {
    return NextResponse.json({ error: copy.missingEmail }, { status: 404 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: copy.sendFailed }, { status: 500 });
  }

  const message = buildCandidateNoticeEmail({
    locale,
    candidateName: String(candidate?.full_name || ''),
    subject,
    message: text,
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
