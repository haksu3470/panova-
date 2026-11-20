import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { duplicateFlags, duplicateLookup } from '@/lib/duplicateCandidate';
import { supabaseAnonKey, validUrl } from '@/lib/supabase';

export const runtime = 'nodejs';

function unavailable() {
  return NextResponse.json({ error: 'unavailable' }, { status: 503 });
}

/**
 * Staff-only duplicate probe. Uses the caller's session (is_staff) before the
 * service-role RPC, so anonymous visitors cannot enumerate candidate PII.
 */
export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!token) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > 4_000) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  if (!validUrl || !supabaseAnonKey) return unavailable();

  const userClient = createClient(validUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: staff } = await userClient.rpc('is_staff');
  if (staff !== true) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
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
