import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

register(new URL('./resolve-at.mjs', import.meta.url).href, import.meta.url);

const { company } = await import('../company.ts');
const {
  acceptContactSubmission,
  buildContactNotification,
  contactFormIdempotencyKey,
  contactOriginAllowed,
  contactSendShouldRetry,
  deliverContactNotification,
  formatContactSubmittedAt,
  parseContactSubmission,
} = await import('./contact-notification.ts');

const id = '11111111-1111-4111-8111-111111111111';

const validBody = {
  companyKey: 'hr',
  companyName: 'Panova HR',
  fullName: 'Ada Lovelace',
  email: 'Ada@Example.com',
  phone: '+90 555 000 00 00',
  notes: 'Merhaba\nikinci satır',
};

test('parse keeps a homepage submission and rejects junk', () => {
  const parsed = parseContactSubmission(validBody);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.email, 'ada@example.com');
  assert.equal(parsed.value.companyKey, 'hr');
  assert.equal(parsed.value.notes, 'Merhaba\nikinci satır');

  assert.equal(parseContactSubmission({ ...validBody, companyKey: 'other' }).ok, false);
  assert.equal(parseContactSubmission({ ...validBody, email: 'not-an-email' }).ok, false);
  assert.equal(parseContactSubmission({ ...validBody, fullName: '  \n' }).ok, false);
  assert.equal(parseContactSubmission({ ...validBody, phone: '' }).ok, false);
  assert.equal(parseContactSubmission(null).ok, false);

  const hostile = parseContactSubmission({
    ...validBody,
    fullName: 'Ada\r\nBcc: evil@example.com',
    notes: '<script>alert(1)</script>',
  });
  assert.equal(hostile.ok, true);
  if (!hostile.ok) return;
  assert.equal(hostile.value.fullName.includes('\n'), false);
  assert.equal(hostile.value.fullName.includes('Bcc:'), true);
});

test('the notification is a Turkish message to the company inbox', () => {
  const parsed = parseContactSubmission({
    ...validBody,
    fullName: 'Ada <b> & "x"',
    notes: '<script>',
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const submittedAt = formatContactSubmittedAt(new Date('2026-10-27T05:00:00.000Z'));
  assert.match(submittedAt, /2026/);
  assert.match(submittedAt, /08:00/);

  const message = buildContactNotification({ ...parsed.value, id, submittedAt });
  assert.equal(message.to, company.email);
  assert.equal(message.to, 'panova@panovagroup.org');
  assert.equal(message.replyTo, 'ada@example.com');
  assert.equal(message.headers['X-Panova-Contact-Form'], id);
  assert.equal(contactFormIdempotencyKey(id), `contact-form/${id}`);
  assert.equal(message.subject.includes('\n'), false);
  assert.match(message.subject, /^Yeni iletişim formu: Ada/);
  assert.match(message.text, /Ad soyad: Ada <b> & "x"/);
  assert.match(message.text, /Firma kodu: hr/);
  assert.match(message.text, /Telefon: \+90 555 000 00 00/);
  assert.match(message.html, /lang="tr"/);
  assert.match(message.html, /Ada &lt;b&gt; &amp; &quot;x&quot;/);
  assert.match(message.html, /&lt;script&gt;/);
  assert.equal(message.html.includes('<script>'), false);
  assert.match(message.html, /https:\/\/panovagroup\.org/);
});

test('a saved submission still succeeds when notification delivery fails', async () => {
  const inserts: { id: string; email: string }[] = [];
  let sent = 0;
  const saved = await acceptContactSubmission(validBody, {
    createId: () => id,
    now: () => new Date('2026-10-27T05:00:00.000Z'),
    insert: async (row) => {
      inserts.push(row);
      return { error: null };
    },
    send: async (message, key) => {
      sent += 1;
      assert.equal(key, `contact-form/${id}`);
      assert.equal(message.to, 'panova@panovagroup.org');
      assert.equal(message.replyTo, 'ada@example.com');
      return { errorName: 'internal_server_error' };
    },
  });
  assert.deepEqual(saved, { ok: true, id, emailSent: false });
  assert.equal(inserts.length, 1);
  assert.equal(sent, 1);

  let sends = 0;
  const thrown = await acceptContactSubmission(validBody, {
    createId: () => id,
    insert: async () => ({ error: null }),
    send: async () => {
      sends += 1;
      throw new Error('network down');
    },
  });
  assert.equal(thrown.ok, true);
  if (thrown.ok) assert.equal(thrown.emailSent, false);
  assert.equal(sends, 1);

  let blocked = 0;
  const failedInsert = await acceptContactSubmission(validBody, {
    insert: async () => ({ error: 'db down' }),
    send: async () => {
      blocked += 1;
      return { errorName: null };
    },
  });
  assert.deepEqual(failedInsert, { ok: false, status: 500 });
  assert.equal(blocked, 0);
  assert.deepEqual(await acceptContactSubmission({ companyKey: 'nope' }, {
    insert: async () => ({ error: null }),
    send: async () => ({ errorName: null }),
  }), { ok: false, status: 400 });
});

test('retries use the same idempotency key and stop on a validation error', async () => {
  const keys: string[] = [];
  const slept: number[] = [];
  const recovered = await deliverContactNotification({
    idempotencyKey: `contact-form/${id}`,
    sleep: async (ms) => { slept.push(ms); },
    send: async (key) => {
      keys.push(key);
      if (keys.length < 3) return { error: { name: 'internal_server_error', statusCode: 500 } };
      return { error: null };
    },
  });
  assert.deepEqual(recovered, { errorName: null });
  assert.deepEqual(keys, [`contact-form/${id}`, `contact-form/${id}`, `contact-form/${id}`]);
  assert.deepEqual(slept, [400, 800]);

  assert.equal(contactSendShouldRetry({ name: 'rate_limit_exceeded', statusCode: 429 }), true);
  assert.equal(contactSendShouldRetry({ name: 'validation_error', statusCode: 422 }), false);
  assert.equal(contactSendShouldRetry({ name: 'invalid_idempotent_request', statusCode: 409 }), false);
  assert.equal(contactSendShouldRetry({ name: 'concurrent_idempotent_requests', statusCode: 409 }), true);

  const rejected = await deliverContactNotification({
    idempotencyKey: `contact-form/${id}`,
    sleep: async () => { throw new Error('should not retry'); },
    send: async () => ({ error: { name: 'validation_error', statusCode: 400 } }),
  });
  assert.deepEqual(rejected, { errorName: 'validation_error' });
});

test('contact posts are limited to this site', () => {
  assert.equal(contactOriginAllowed(null, 'panovagroup.org'), true);
  assert.equal(contactOriginAllowed('https://panovagroup.org', 'panovagroup.org'), true);
  assert.equal(contactOriginAllowed('https://www.panovagroup.org', 'preview.vercel.app'), true);
  assert.equal(contactOriginAllowed('https://panova-xi.vercel.app', 'panova-xi.vercel.app'), true);
  assert.equal(contactOriginAllowed('http://localhost:3000', 'localhost:3000'), true);
  assert.equal(contactOriginAllowed('https://evil.example', 'panovagroup.org'), false);
  assert.equal(contactOriginAllowed('not a url', 'panovagroup.org'), false);
});
