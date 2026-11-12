import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { buildSupportReplyEmail } from '@/lib/email/app-messages';
import { emailLocale } from '@/lib/email/email-copy';
import { NOREPLY_FROM } from '@/lib/email/forward-inbound';
import { supportReplyIdempotencyKey } from '@/lib/supportTickets';
import { supabaseAnonKey, validUrl } from '@/lib/supabase';

export const runtime = 'nodejs';

const TICKET_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const ticketId = body && typeof body === 'object' ? String((body as { ticketId?: unknown }).ticketId || '') : '';
  if (!TICKET_ID.test(ticketId)) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const userClient = createClient(validUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: staff } = await userClient.rpc('is_staff');
  if (staff !== true) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { data: ticket, error } = await userClient
    .from('candidate_support_tickets')
    .select('id, candidate_id, subject, admin_reply, replied_at')
    .eq('id', ticketId)
    .maybeSingle();
  const reply = String(ticket?.admin_reply || '').trim();
  if (error || !ticket?.candidate_id || !reply) {
    return NextResponse.json({ error: 'unavailable' }, { status: 404 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = process.env.RESEND_API_KEY;
  if (!serviceKey || !apiKey) return NextResponse.json({ ok: false, emailed: false }, { status: 503 });

  const admin = createClient(validUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: candidate } = await admin
    .from('job_candidates')
    .select('email, full_name, auth_user_id')
    .eq('id', ticket.candidate_id)
    .maybeSingle();

  let locale = emailLocale(undefined);
  let authEmail = '';
  if (candidate?.auth_user_id) {
    const { data: userResult } = await admin.auth.admin.getUserById(candidate.auth_user_id);
    locale = emailLocale(userResult.user?.user_metadata?.locale);
    authEmail = userResult.user?.email || '';
  }
  const to = (authEmail || candidate?.email || '').trim();
  if (!to.includes('@')) return NextResponse.json({ ok: true, emailed: false });

  const message = buildSupportReplyEmail({
    locale,
    candidateName: candidate?.full_name,
    subject: String(ticket.subject || ''),
    message: reply,
  });
  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.emails.send({
    from: NOREPLY_FROM,
    to: [to],
    subject: message.subject,
    html: message.html,
    text: message.text,
  }, {
    idempotencyKey: supportReplyIdempotencyKey(ticket.id, String(ticket.replied_at || '')),
  });
  if (sendError) {
    console.error('Support reply email failed', sendError.name);
    return NextResponse.json({ ok: false, emailed: false }, { status: 502 });
  }
  return NextResponse.json({ ok: true, emailed: true });
}
