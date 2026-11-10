import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { duplicateFlags, duplicateLookup } from '@/lib/duplicateCandidate';
import { validUrl } from '@/lib/supabase';

export const runtime = 'nodejs';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 20;
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

function unavailable() {
  return NextResponse.json({ error: 'unavailable' }, { status: 503 });
}

export async function POST(request: Request) {
  if (tooMany(clientIp(request))) {
    return NextResponse.json({ error: 'unavailable' }, { status: 429 });
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > 4_000) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  const raw = body && typeof body === 'object' ? body as { email?: unknown; passport?: unknown; phone?: unknown } : {};
  const lookup = duplicateLookup(raw);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return unavailable();

  const admin = createClient(validUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.rpc('candidate_duplicate_flags', {
    p_email: lookup.email,
    p_passport: lookup.passport,
    p_phone: lookup.phone,
  });
  if (error) {
    console.error('candidate duplicate check failed', error.code || 'rpc');
    return unavailable();
  }

  let payload: unknown = data;
  if (typeof data === 'string') {
    try {
      payload = JSON.parse(data);
    } catch {
      return unavailable();
    }
  }
  const flags = duplicateFlags(payload);
  if (!flags) return unavailable();
  return NextResponse.json({ email: flags.email, passport: flags.passport, phone: flags.phone });
}
