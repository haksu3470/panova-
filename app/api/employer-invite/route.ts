import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

import { buildEmployerInviteEmail } from '@/lib/email/app-messages';
import { forwardFromAddress } from '@/lib/email/forward-inbound';
import {
  employerLoginUrl,
  employerPasswordSetupUrl,
  isSafeActionLink,
  parseInviteFailure,
  type EmployerInviteOutcome,
} from '@/lib/employerInvite';
import { supabaseAnonKey, validUrl } from '@/lib/supabase';

export const runtime = 'nodejs';

type InvitePlan = {
  outcome?: EmployerInviteOutcome;
  email?: string;
  company_name?: string | null;
  contact_name?: string | null;
  locale?: string;
  employer_id?: string;
  auth_user_id?: string | null;
  linked?: boolean;
  invited_at?: string;
};

function userClient(token: string) {
  return createClient(validUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(validUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function actionLink(
  admin: SupabaseClient,
  outcome: EmployerInviteOutcome,
  email: string,
  locale: string,
  employerId: string,
): Promise<string | null> {
  const redirectTo = employerPasswordSetupUrl();
  const generated = outcome === 'invite_new'
    ? await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { redirectTo, data: { locale } },
    })
    : await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    });

  if (generated.error || !generated.data) {
    if (outcome === 'invite_new' && /already|registered|exists/i.test(generated.error?.message || '')) {
      const recovery = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo },
      });
      const recoveryLink = recovery.data?.properties?.action_link;
      return recovery.error || !recoveryLink ? null : recoveryLink;
    }
    return null;
  }

  const userId = generated.data.user?.id;
  if (outcome === 'invite_new' && userId) {
    const current = generated.data.user?.app_metadata;
    const appMetadata = current && typeof current === 'object' ? { ...current } : {};
    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { ...appMetadata, invited_employer_id: employerId },
    });
  }

  return generated.data.properties?.action_link || null;
}

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'forbidden' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 400 });
  }
  const employerId = body && typeof body === 'object' && typeof (body as { employerId?: unknown }).employerId === 'string'
    ? (body as { employerId: string }).employerId.trim()
    : '';
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employerId)) {
    return NextResponse.json({ error: 'not_found' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'email_unavailable' }, { status: 503 });
  }

  const sb = userClient(token);
  const prepared = await sb.rpc('prepare_employer_login_invite', { p_employer_id: employerId });
  if (prepared.error || !prepared.data) {
    const failure = parseInviteFailure(prepared.error?.message, prepared.error?.details);
    const status = failure.code === 'forbidden' ? 403
      : failure.code === 'not_found' ? 404
        : failure.code === 'invite_cooldown' ? 429
          : failure.code === 'employer_email_missing' ? 400
            : failure.code === 'failed' ? 400
              : 409;
    return NextResponse.json(
      { error: failure.code, retryAfterSeconds: failure.retryAfterSeconds },
      { status },
    );
  }

  const plan = prepared.data as InvitePlan;
  const outcome: EmployerInviteOutcome = plan.outcome === 'link_existing' || plan.outcome === 'already_linked'
    ? plan.outcome
    : 'invite_new';
  const email = String(plan.email || '').trim().toLowerCase();
  if (!email.includes('@')) return NextResponse.json({ error: 'employer_email_missing' }, { status: 400 });

  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: 'email_unavailable' }, { status: 503 });

  const link = await actionLink(admin, outcome, email, plan.locale || 'tr', employerId);
  if (!link || !isSafeActionLink(link)) {
    return NextResponse.json({
      ok: false,
      emailSent: false,
      error: 'email_failed',
      outcome,
      linked: Boolean(plan.linked),
      authUserId: plan.auth_user_id ?? null,
      invitedAt: plan.invited_at ?? null,
    }, { status: 502 });
  }

  const message = buildEmployerInviteEmail({
    locale: plan.locale,
    kind: outcome === 'invite_new' ? 'invite' : 'reset',
    companyName: plan.company_name || email,
    contactName: plan.contact_name || undefined,
    email,
    actionUrl: link,
    loginUrl: employerLoginUrl(),
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const sent = await resend.emails.send(
    {
      from: forwardFromAddress(),
      to: [email],
      subject: message.subject,
      html: message.html,
      text: message.text,
    },
    { idempotencyKey: `employer-invite/${employerId}/${outcome}/${String(plan.invited_at || '').replace(/[^0-9A-Za-z]/g, '')}` },
  );
  if (sent.error) {
    return NextResponse.json({
      ok: false,
      emailSent: false,
      error: 'email_failed',
      outcome,
      linked: Boolean(plan.linked),
      authUserId: plan.auth_user_id ?? null,
      invitedAt: plan.invited_at ?? null,
    }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    emailSent: true,
    outcome,
    linked: Boolean(plan.linked),
    authUserId: plan.auth_user_id ?? null,
    invitedAt: plan.invited_at ?? null,
  });
}
