import { company } from '@/lib/company';

/** General company mailbox. Also the default From address for forwards. */
export const INBOX_ADDRESS = company.email;

export const COMPANY_DOMAIN = 'panovagroup.org';

/** Private destination. Not rendered on the public site. */
export const FORWARD_TO = 'huseyinaksu@gmail.com';

export const SUBJECT_PREFIX = '[Panova]';

/** Skip binaries above this so the forward still sends. */
export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

export function extractEmails(value: unknown): string[] {
  if (value == null) return [];
  const parts = Array.isArray(value) ? value : [value];
  const found: string[] = [];
  for (const part of parts) {
    const matches = String(part).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
    if (matches) found.push(...matches.map((m) => m.toLowerCase()));
  }
  return found;
}

export function joinAddresses(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean).join(', ');
  return String(value);
}

/**
 * From address for the forward. Uses RESEND_FROM when it is on panovagroup.org
 * (for example `Panova <panova@panovagroup.org>` or a noreply address on the
 * same verified domain). Otherwise sends as the company mailbox.
 */
export function forwardFromAddress(): string {
  const configured = process.env.RESEND_FROM?.trim();
  if (configured && /@panovagroup\.org\b/i.test(configured)) return configured;
  return `Panova <${INBOX_ADDRESS}>`;
}

export function isCompanyMailbox(email: string): boolean {
  const at = email.lastIndexOf('@');
  return at > 0 && email.slice(at + 1) === COMPANY_DOMAIN;
}

/** True when any recipient is on panovagroup.org (panova@, turkiye@, baglades@, or another mailbox). */
export function isAddressedToCompany(input: {
  to?: unknown;
  cc?: unknown;
  bcc?: unknown;
  received_for?: unknown;
}): boolean {
  const all = [
    ...extractEmails(input.to),
    ...extractEmails(input.cc),
    ...extractEmails(input.bcc),
    ...extractEmails(input.received_for),
  ];
  return all.some(isCompanyMailbox);
}

/** Header values cannot contain CR/LF. */
export function headerValue(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, 900);
}

export function normalizeHeaders(headers: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  if (Array.isArray(headers)) {
    for (const entry of headers) {
      if (!entry || typeof entry !== 'object') continue;
      const name = 'name' in entry ? String(entry.name) : '';
      const value = 'value' in entry ? String(entry.value) : '';
      if (!name) continue;
      const key = name.toLowerCase();
      out[key] = out[key] ? `${out[key]}, ${value}` : value;
    }
    return out;
  }
  if (typeof headers === 'object') {
    for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
      if (value == null) continue;
      out[key.toLowerCase()] = Array.isArray(value) ? value.map(String).join(', ') : String(value);
    }
  }
  return out;
}

export type SkipReason = 'not-company' | 'auto-submitted' | 'already-forwarded' | 'from-self';

/** Drop mail that would loop or that was not sent to a panovagroup.org mailbox. */
export function skipReason(input: {
  from?: unknown;
  to?: unknown;
  cc?: unknown;
  bcc?: unknown;
  received_for?: unknown;
  headers?: unknown;
}): SkipReason | null {
  if (!isAddressedToCompany(input)) return 'not-company';

  const headers = normalizeHeaders(input.headers);
  const auto = (headers['auto-submitted'] || '').trim().toLowerCase();
  if (auto && auto !== 'no') return 'auto-submitted';
  if (headers['x-panova-forwarded']) return 'already-forwarded';

  const froms = extractEmails(input.from);
  if (froms.some((f) => f.startsWith('mailer-daemon@') || f.startsWith('postmaster@'))) {
    return 'auto-submitted';
  }

  if (froms.some(isCompanyMailbox)) return 'from-self';

  return null;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c
  ));
}

export function prefixedSubject(subject: string | null | undefined): string {
  const raw = (subject || '').replace(/[\r\n]+/g, ' ').trim() || '(konu yok)';
  if (raw.toLowerCase().startsWith(SUBJECT_PREFIX.toLowerCase())) return raw.slice(0, 900);
  return `${SUBJECT_PREFIX} ${raw}`.slice(0, 900);
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function buildForwardContent(input: {
  from: string;
  to: string;
  cc?: string;
  subject: string;
  date?: string;
  text?: string | null;
  html?: string | null;
  attachmentNote?: string;
}): { text: string; html: string } {
  const plainBody = (input.text || '').trim() || (input.html ? htmlToText(input.html) : '') || '(gövde yok)';
  const text = [
    'Panova gelen kutusu iletisi. Yanıt, özgün gönderene gider.',
    '',
    `Kimden: ${input.from || '—'}`,
    `Kime: ${input.to || '—'}`,
    ...(input.cc ? [`Cc: ${input.cc}`] : []),
    `Konu: ${input.subject || '—'}`,
    ...(input.date ? [`Tarih: ${input.date}`] : []),
    ...(input.attachmentNote ? ['', input.attachmentNote] : []),
    '',
    '---------- Özgün ileti ----------',
    '',
    plainBody,
  ].join('\n');

  const html = `
<div style="font-family:Arial,sans-serif;color:#333;font-size:14px;line-height:1.5">
  <p style="margin:0 0 12px"><strong>Panova gelen kutusu iletisi.</strong> Yanıt, özgün gönderene gider.</p>
  <p style="margin:0">Kimden: ${escapeHtml(input.from || '—')}</p>
  <p style="margin:0">Kime: ${escapeHtml(input.to || '—')}</p>
  ${input.cc ? `<p style="margin:0">Cc: ${escapeHtml(input.cc)}</p>` : ''}
  <p style="margin:0">Konu: ${escapeHtml(input.subject || '—')}</p>
  ${input.date ? `<p style="margin:0">Tarih: ${escapeHtml(input.date)}</p>` : ''}
  ${input.attachmentNote ? `<p style="margin:12px 0 0">${escapeHtml(input.attachmentNote)}</p>` : ''}
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0" />
  ${input.html?.trim()
    ? input.html
    : `<pre style="white-space:pre-wrap;font-family:Arial,sans-serif">${escapeHtml(plainBody)}</pre>`}
</div>`.trim();

  return { text, html };
}

