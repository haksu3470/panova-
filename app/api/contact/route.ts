import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  acceptContactSubmission,
  contactOriginAllowed,
  deliverContactNotification,
  type ContactInsertRow,
  type ContactNotification,
} from '@/lib/email/contact-notification';
import { forwardFromAddress } from '@/lib/email/forward-inbound';
import { supabaseAnonKey, validUrl } from '@/lib/supabase';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 32_000;

async function insertContact(row: ContactInsertRow): Promise<{ error: string | null }> {
  const supabase = createClient(validUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.from('contact_submissions').insert(row);
  return { error: error ? error.message : null };
}

async function sendContactNotification(
  message: ContactNotification,
  idempotencyKey: string,
): Promise<{ errorName: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { errorName: 'missing_api_key' };

  const resend = new Resend(apiKey);
  const payload = {
    from: forwardFromAddress(),
    to: [message.to],
    subject: message.subject,
    html: message.html,
    text: message.text,
    replyTo: message.replyTo,
    headers: message.headers,
    tags: [{ name: 'category', value: 'contact_form' }],
  };

  return deliverContactNotification({
    idempotencyKey,
    send: async (key) => {
      try {
        const { error } = await resend.emails.send(payload, { idempotencyKey: key });
        return { error };
      } catch (error) {
        console.error('Contact form notification threw', error instanceof Error ? error.name : 'error');
        return { error: { name: 'application_error' as const, statusCode: 500 } };
      }
    },
  });
}

export async function POST(request: Request) {
  if (!contactOriginAllowed(request.headers.get('origin'), request.headers.get('host'))) {
    console.error('Contact form origin rejected');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const result = await acceptContactSubmission(body, {
      insert: insertContact,
      send: sendContactNotification,
    });
    if (!result.ok) {
      const error = result.status === 400 ? 'Invalid request' : 'Could not save the message';
      return NextResponse.json({ error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Contact form failed', error instanceof Error ? error.name : 'error');
    return NextResponse.json({ error: 'Could not save the message' }, { status: 500 });
  }
}
