import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  FORWARD_TO,
  MAX_ATTACHMENT_BYTES,
  buildForwardContent,
  extractEmails,
  forwardFromAddress,
  headerValue,
  isAddressedToCompany,
  joinAddresses,
  prefixedSubject,
  skipReason,
} from '@/lib/email/forward-inbound';

export const runtime = 'nodejs';

type ListedAttachment = {
  id: string;
  filename?: string;
  size: number;
  content_type: string;
  content_id?: string;
  download_url: string;
};

function signingHeaders(request: Request) {
  return {
    id: request.headers.get('svix-id') || request.headers.get('webhook-id') || '',
    timestamp: request.headers.get('svix-timestamp') || request.headers.get('webhook-timestamp') || '',
    signature: request.headers.get('svix-signature') || request.headers.get('webhook-signature') || '',
  };
}

async function listAttachments(resend: Resend, emailId: string): Promise<ListedAttachment[]> {
  const items: ListedAttachment[] = [];
  let after: string | undefined;
  for (let page = 0; page < 5; page++) {
    const { data, error } = await resend.emails.receiving.attachments.list(
      after ? { emailId, limit: 100, after } : { emailId, limit: 100 },
    );
    if (error || !data) throw new Error('attachment list failed');
    items.push(...data.data);
    if (!data.has_more || data.data.length === 0) break;
    const next = data.data[data.data.length - 1]?.id;
    if (!next || next === after) break;
    after = next;
  }
  return items;
}

function omittedNote(items: ListedAttachment[]): string {
  const names = items.map((item) => item.filename || 'attachment').join(', ');
  return `Ekler boyut sınırı nedeniyle iletilmedi: ${names}`;
}

async function loadAttachments(
  resend: Resend,
  emailId: string,
): Promise<{ attachments: { filename: string; content: string; contentType?: string; contentId?: string }[]; note: string }> {
  const items = await listAttachments(resend, emailId);
  if (!items.length) return { attachments: [], note: '' };

  const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
  if (totalSize > MAX_ATTACHMENT_BYTES) return { attachments: [], note: omittedNote(items) };

  const attachments: { filename: string; content: string; contentType?: string; contentId?: string }[] = [];
  let downloaded = 0;
  for (const item of items) {
    const response = await fetch(item.download_url);
    if (!response.ok) throw new Error('attachment download failed');
    const bytes = Buffer.from(await response.arrayBuffer());
    downloaded += bytes.length;
    if (downloaded > MAX_ATTACHMENT_BYTES) return { attachments: [], note: omittedNote(items) };
    const contentId = item.content_id?.replace(/^<|>$/g, '');
    attachments.push({
      filename: item.filename?.trim() || 'attachment',
      content: bytes.toString('base64'),
      ...(item.content_type ? { contentType: item.content_type } : {}),
      ...(contentId ? { contentId } : {}),
    });
  }
  return { attachments, note: '' };
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  if (!webhookSecret || !apiKey) {
    console.error('Resend inbound webhook is not configured');
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 500 });
  }

  const payload = await request.text();
  const resend = new Resend(apiKey);

  let event: ReturnType<Resend['webhooks']['verify']>;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: signingHeaders(request),
      webhookSecret,
    });
  } catch {
    console.error('Resend webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'email.received') {
    return NextResponse.json({ ok: true });
  }

  const inbound = event.data;
  if (!isAddressedToCompany(inbound)) {
    return NextResponse.json({ ok: true, skipped: 'not-company' });
  }

  const { data: email, error: getError } = await resend.emails.receiving.get(inbound.email_id, {
    html_format: 'cid',
  });
  if (getError || !email) {
    console.error('Failed to fetch received email', inbound.email_id);
    return NextResponse.json({ error: 'Failed to fetch email' }, { status: 500 });
  }

  const reason = skipReason({
    from: email.from,
    to: email.to,
    cc: email.cc,
    bcc: email.bcc,
    received_for: email.received_for,
    headers: email.headers,
  });
  if (reason) {
    console.info('Inbound forward skipped', inbound.email_id, reason);
    return NextResponse.json({ ok: true, skipped: reason });
  }

  let attachments: { filename: string; content: string; contentType?: string; contentId?: string }[] = [];
  let attachmentNote = '';
  if (email.attachments.length > 0 || inbound.attachments.length > 0) {
    try {
      const loaded = await loadAttachments(resend, inbound.email_id);
      attachments = loaded.attachments;
      attachmentNote = loaded.note;
    } catch {
      console.error('Failed to fetch inbound attachments', inbound.email_id);
      return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
    }
  }

  const fromHeader = joinAddresses(email.from);
  const replyTo = extractEmails(fromHeader)[0];
  const content = buildForwardContent({
    from: fromHeader,
    to: joinAddresses(email.to),
    cc: joinAddresses(email.cc) || undefined,
    subject: email.subject,
    date: email.created_at,
    text: email.text,
    html: email.html,
    attachmentNote,
  });

  const { error: sendError } = await resend.emails.send(
    {
      from: forwardFromAddress(),
      to: [FORWARD_TO],
      subject: prefixedSubject(email.subject),
      text: content.text,
      html: content.html,
      ...(replyTo ? { replyTo } : {}),
      headers: {
        'X-Panova-Forwarded': headerValue(inbound.email_id),
        'X-Original-From': headerValue(fromHeader),
      },
      ...(attachments.length ? { attachments } : {}),
    },
    { idempotencyKey: `inbound-forward/${inbound.email_id}` },
  );

  if (sendError) {
    if (sendError.name === 'invalid_idempotent_request') {
      console.info('Inbound forward already sent', inbound.email_id);
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error('Inbound forward failed', inbound.email_id, sendError.name);
    return NextResponse.json({ error: 'Failed to forward email' }, { status: 500 });
  }

  console.info('Inbound mail forwarded', inbound.email_id);
  return NextResponse.json({ ok: true });
}
