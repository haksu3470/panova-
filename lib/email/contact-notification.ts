import { INBOX_ADDRESS, escapeHtml, headerValue } from './forward-inbound';

export const CONTACT_NOTIFY_TO = INBOX_ADDRESS;

const COMPANY_KEYS = ['hr', 'trade', 'agriculture', 'construction'] as const;

export type CompanyKey = (typeof COMPANY_KEYS)[number];

export type ContactFields = {
  companyKey: CompanyKey;
  companyName: string;
  fullName: string;
  email: string;
  phone: string;
  notes: string;
};

export type ContactInsertRow = {
  id: string;
  company_key: string;
  company_name: string;
  full_name: string;
  email: string;
  phone: string;
  notes: string;
};

export type ContactNotification = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo: string;
  headers: Record<string, string>;
};

const LIMITS = {
  fullName: 120,
  email: 254,
  phone: 40,
  companyName: 160,
  notes: 4000,
} as const;

const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function singleLine(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function multiline(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

export function parseContactSubmission(body: unknown): { ok: true; value: ContactFields } | { ok: false } {
  if (!body || typeof body !== 'object') return { ok: false };
  const raw = body as Record<string, unknown>;
  const companyKey = String(raw.companyKey ?? raw.company_key ?? '').trim();
  if (!COMPANY_KEYS.includes(companyKey as CompanyKey)) return { ok: false };

  const fullName = singleLine(raw.fullName ?? raw.full_name, LIMITS.fullName);
  const email = singleLine(raw.email, LIMITS.email).toLowerCase();
  const phone = singleLine(raw.phone, LIMITS.phone);
  const companyName = singleLine(raw.companyName ?? raw.company_name, LIMITS.companyName);
  const notes = multiline(raw.notes, LIMITS.notes);
  if (!fullName || !phone || !EMAIL_RE.test(email)) return { ok: false };

  return {
    ok: true,
    value: {
      companyKey: companyKey as CompanyKey,
      companyName: companyName || companyKey,
      fullName,
      email,
      phone,
      notes,
    },
  };
}

/** Same-origin browser posts, plus the public site when Host and Origin differ. */
export function contactOriginAllowed(origin: string | null, host: string | null): boolean {
  if (!origin) return true;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  if (host && originHost === host) return true;
  return originHost === 'panovagroup.org' || originHost === 'www.panovagroup.org';
}

export function contactFormIdempotencyKey(id: string): string {
  return `contact-form/${id}`;
}

export function formatContactSubmittedAt(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Istanbul',
  }).format(date);
}

export function buildContactNotification(input: ContactFields & { id: string; submittedAt: string }): ContactNotification {
  const notes = input.notes.trim() || '—';
  const subject = headerValue(`Yeni iletişim formu: ${input.fullName} — ${input.companyName}`).slice(0, 180);
  const text = [
    'Panova web sitesinden yeni bir iletişim formu geldi.',
    'Bu iletiye yanıt, formu dolduran kişiye gider.',
    '',
    `Ad soyad: ${input.fullName}`,
    `E-posta: ${input.email}`,
    `Telefon: ${input.phone}`,
    `Firma: ${input.companyName}`,
    `Firma kodu: ${input.companyKey}`,
    `Gönderim: ${input.submittedAt}`,
    `Kayıt no: ${input.id}`,
    '',
    'Not:',
    notes,
  ].join('\n');

  const row = (label: string, value: string) =>
    `<p style="margin:0 0 8px"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;

  const html = `<!DOCTYPE html>
<html lang="tr" dir="ltr">
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body>
  <div lang="tr" dir="ltr" style="font-family:Arial,sans-serif;color:#0f172a;font-size:15px;line-height:1.5;max-width:600px">
    <h1 style="color:#1b5e20;font-size:20px;margin:0 0 12px">Yeni iletişim formu</h1>
    <p style="margin:0 0 16px">Panova web sitesinden yeni bir iletişim formu geldi. Bu iletiye yanıt, formu dolduran kişiye gider.</p>
    ${row('Ad soyad', input.fullName)}
    <p style="margin:0 0 8px"><strong>E-posta:</strong> <a href="mailto:${escapeHtml(input.email)}" style="color:#1b5e20">${escapeHtml(input.email)}</a></p>
    ${row('Telefon', input.phone)}
    ${row('Firma', input.companyName)}
    ${row('Firma kodu', input.companyKey)}
    ${row('Gönderim', input.submittedAt)}
    ${row('Kayıt no', input.id)}
    <h2 style="font-size:16px;margin:16px 0 8px">Not</h2>
    <p style="margin:0;white-space:pre-wrap">${escapeHtml(notes)}</p>
    <p style="margin:24px 0 0;font-size:12px;color:#334155">Panova Group · <a href="https://panovagroup.org" style="color:#1b5e20">panovagroup.org</a></p>
  </div>
</body>
</html>`;

  return {
    to: CONTACT_NOTIFY_TO,
    subject,
    text,
    html,
    replyTo: input.email,
    headers: { 'X-Panova-Contact-Form': input.id },
  };
}

type SendError = { name: string; statusCode: number | null };

export function contactSendShouldRetry(error: SendError): boolean {
  if (error.name === 'concurrent_idempotent_requests') return true;
  if (error.name === 'invalid_idempotent_request') return false;
  if (error.statusCode === 429) return true;
  return error.statusCode != null && error.statusCode >= 500;
}

export async function deliverContactNotification(input: {
  idempotencyKey: string;
  send: (idempotencyKey: string) => Promise<{ error: SendError | null }>;
  sleep?: (ms: number) => Promise<void>;
}): Promise<{ errorName: string | null }> {
  const sleep = input.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  let errorName: string | null = 'send_failed';
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await input.send(input.idempotencyKey);
    if (!error) return { errorName: null };
    errorName = error.name;
    if (!contactSendShouldRetry(error) || attempt === 2) break;
    await sleep(400 * (attempt + 1));
  }
  return { errorName };
}

export async function acceptContactSubmission(
  body: unknown,
  deps: {
    insert: (row: ContactInsertRow) => Promise<{ error: string | null }>;
    send: (message: ContactNotification, idempotencyKey: string) => Promise<{ errorName: string | null }>;
    createId?: () => string;
    now?: () => Date;
  },
): Promise<{ ok: true; id: string; emailSent: boolean } | { ok: false; status: 400 | 500 }> {
  const parsed = parseContactSubmission(body);
  if (!parsed.ok) return { ok: false, status: 400 };

  const id = (deps.createId ?? (() => crypto.randomUUID()))();
  const submittedAt = formatContactSubmittedAt((deps.now ?? (() => new Date()))());
  const fields = parsed.value;
  const inserted = await deps.insert({
    id,
    company_key: fields.companyKey,
    company_name: fields.companyName,
    full_name: fields.fullName,
    email: fields.email,
    phone: fields.phone,
    notes: fields.notes,
  });
  if (inserted.error) {
    console.error('Contact form insert failed');
    return { ok: false, status: 500 };
  }

  const message = buildContactNotification({ ...fields, id, submittedAt });
  let emailSent = false;
  try {
    const sent = await deps.send(message, contactFormIdempotencyKey(id));
    emailSent = !sent.errorName;
    if (sent.errorName) console.error('Contact form notification failed', id, sent.errorName);
  } catch (error) {
    console.error('Contact form notification failed', id, error instanceof Error ? error.name : 'error');
  }
  return { ok: true, id, emailSent };
}
