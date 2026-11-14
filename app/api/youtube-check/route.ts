import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validUrl as SUPABASE_URL, supabaseAnonKey as SUPABASE_ANON } from '@/lib/supabase';
import { allowedChannelHandle, handleYouTubeCheck, type SessionRole } from '@/lib/youtubeChannel';

export const runtime = 'nodejs';

/** The caller's own session: a valid user, then their staff role from current_staff(). */
async function sessionRole(token: string): Promise<SessionRole> {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await sb.auth.getUser(token);
  if (userError || !userData?.user) return { session: false };
  const { data, error } = await sb.rpc('current_staff');
  if (error) return { session: true, role: null };
  const row = Array.isArray(data) ? data[0] : data;
  const role = row && typeof row === 'object' ? (row as { role_level?: unknown }).role_level : null;
  return { session: true, role: typeof role === 'string' ? role : null };
}

// No logging of the link or the oEmbed answer: they can identify a candidate.
export async function POST(request: Request) {
  const result = await handleYouTubeCheck(request, {
    sessionRole,
    fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    allowedHandle: allowedChannelHandle(),
  });
  return NextResponse.json(result.body, { status: result.status, headers: { 'cache-control': 'no-store' } });
}
