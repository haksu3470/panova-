import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAnonKey, validUrl } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Daily ping so Free-plan Supabase does not pause for inactivity.
 * Vercel Cron only (Authorization: Bearer CRON_SECRET). Schedule: vercel.json.
 * Not a guarantee — Pro is the official no-pause path.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceKey || supabaseAnonKey;
  const client = createClient(validUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Tiny read: hits Postgres (counts as user DB activity for Free pause).
  const { error } = await client.from('app_settings').select('key').limit(1);

  if (error) {
    console.error('supabase keepalive failed', error.code || error.message);
    return NextResponse.json(
      { ok: false, error: error.code || 'query_failed' },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    at: new Date().toISOString(),
    via: serviceKey ? 'service_role' : 'anon',
  });
}
