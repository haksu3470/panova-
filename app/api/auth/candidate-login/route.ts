import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isEmailNotConfirmedMessage } from '@/lib/emailVerification';
import { classifyLoginIdentifier } from '@/lib/loginIdentifier';
import { supabaseAnonKey, validUrl } from '@/lib/supabase';

export const runtime = 'nodejs';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 30;
const attempts = new Map<string, number[]>();

function tooMany(ip: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  return recent.length > MAX_ATTEMPTS;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'unknown';
}

function anonClient() {
  return createClient(validUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Same body for a missing account and a wrong password. */
function invalid() {
  return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
}

export async function POST(request: Request) {
  if (tooMany(clientIp(request))) {
    return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalid();
  }
  const raw = body && typeof body === 'object' ? (body as { identifier?: unknown; password?: unknown }) : {};
  const password = typeof raw.password === 'string' ? raw.password : '';
  const classified = classifyLoginIdentifier(typeof raw.identifier === 'string' ? raw.identifier : '');
  if (!classified || password.length < 8) return invalid();

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (classified.kind !== 'email' && !serviceKey) {
    return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503 });
  }

  let email = classified.kind === 'email' ? classified.key : '';
  if (classified.kind !== 'email') {
    const admin = createClient(validUrl, serviceKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.rpc('resolve_candidate_login_email', { p_identifier: classified.key });
    if (error) {
      console.error('candidate login lookup failed', error.code || 'rpc');
      return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 503 });
    }
    if (typeof data !== 'string' || !data.includes('@')) {
      await anonClient().auth.signInWithPassword({
        email: 'no-such-user@panovagroup.invalid',
        password,
      });
      return invalid();
    }
    email = data;
  }

  const { data, error } = await anonClient().auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    if (isEmailNotConfirmedMessage(error?.message)) {
      return NextResponse.json({ ok: false, error: 'email_not_confirmed', email }, { status: 403 });
    }
    return invalid();
  }

  return NextResponse.json({
    ok: true,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
}
