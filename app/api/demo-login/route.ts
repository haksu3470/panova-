import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { supabaseAnonKey, validUrl } from '@/lib/supabase';
import { demoLoginRedirect, isDemoLoginKind } from '@/lib/demoLogin';
import { isSafeActionLink } from '@/lib/employerInvite';

export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Plan = { kind: string; name: string; email: string; auth_user_id: string | null; path: string };

/**
 * One-time sign-in link for a demo candidate / demo employer / test staff
 * account. prepare_demo_login (called with the caller's own token) checks
 * upper management and the target, and writes the audit row; only then the
 * service role creates a missing demo candidate login and the magic link.
 */
export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'forbidden' }, { status: 401 });

  let body: { kind?: unknown; id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 400 });
  }
  const kind = typeof body.kind === 'string' ? body.kind : '';
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  if (!isDemoLoginKind(kind) || !UUID.test(id)) return NextResponse.json({ error: 'failed' }, { status: 400 });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !validUrl) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

  const user = createClient(validUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const prepared = await user.rpc('prepare_demo_login', { p_kind: kind, p_id: id });
  if (prepared.error || !prepared.data) {
    const message = prepared.error?.message || 'failed';
    const status = /forbidden|not_allowed/.test(message) ? 403 : 400;
    return NextResponse.json({ error: (message.match(/demo_login_[a-z_]+/)?.[0] || 'failed') }, { status });
  }
  const plan = prepared.data as Plan;

  const admin = createClient(validUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // A demo candidate without a login gets one (e-mail confirmed, consent recorded as the demo seed).
  if (kind === 'candidate' && !plan.auth_user_id) {
    const created = await admin.auth.admin.createUser({
      email: plan.email,
      email_confirm: true,
      user_metadata: {
        role: 'candidate',
        full_name: plan.name,
        kvkk_accepted_at: new Date().toISOString(),
        kvkk_version: 'demo',
      },
    });
    if (created.error && !/already|registered|exists/i.test(created.error.message)) {
      return NextResponse.json({ error: 'account_failed' }, { status: 500 });
    }
  }

  const redirectTo = demoLoginRedirect(request.headers.get('origin'), plan.path);
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email: plan.email, options: { redirectTo } });
  const actionLink = link.data?.properties?.action_link;
  if (link.error || !actionLink || !isSafeActionLink(actionLink)) {
    return NextResponse.json({ error: 'link_failed' }, { status: 500 });
  }

  if (kind === 'candidate' && !plan.auth_user_id && link.data.user?.id) {
    // Only a demo candidate with no login yet (prepare_demo_login checked both).
    const linked = await admin
      .from('job_candidates')
      .update({ auth_user_id: link.data.user.id })
      .eq('id', id)
      .eq('is_demo', true)
      .is('auth_user_id', null);
    if (linked.error) return NextResponse.json({ error: 'account_failed' }, { status: 500 });
  }

  return NextResponse.json({ link: actionLink, name: plan.name });
}
