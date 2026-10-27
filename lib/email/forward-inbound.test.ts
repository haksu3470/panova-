import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
import { company } from '../company.ts';

// forward-inbound.ts imports `@/lib/company`. Register the Next.js alias before loading it.
register(new URL('./resolve-at.mjs', import.meta.url).href, import.meta.url);

const {
  buildForwardContent,
  contactFormSubmissionId,
  forwardReplyAddress,
  isAddressedToCompany,
  isCompanyMailbox,
  isPersonalInbox,
  isSharedCompanyMailbox,
  skipReason,
} = await import('./forward-inbound.ts');

const contactHeader = { 'X-Panova-Contact-Form': '11111111-1111-4111-8111-111111111111' };

const external = 'visitor@example.com';

test('shared company mailboxes still forward', () => {
  for (const mailbox of [company.email, company.turkey.email, company.bangladesh.email]) {
    assert.equal(isSharedCompanyMailbox(mailbox), true);
    assert.equal(isPersonalInbox(mailbox), false);
    assert.equal(isAddressedToCompany({ to: mailbox }), true);
    assert.equal(skipReason({ from: external, to: mailbox }), null);
  }
  assert.equal(isAddressedToCompany({ cc: 'Türkiye <Turkiye@PanovaGroup.org>' }), true);
  assert.equal(isAddressedToCompany({ bcc: company.bangladesh.email }), true);
  assert.equal(isAddressedToCompany({ received_for: company.email }), true);
});

test('personal inboxes are not forwarded', () => {
  for (const mailbox of [
    'haksu@panovagroup.org',
    'HAKSU@panovagroup.org',
    'Hüseyin Aksu <haksu@panovagroup.org>',
    'mcitil@panovagroup.org',
    'Mcitil@PANOVAGroup.org',
    'Mehmet Çitil <mcitil@panovagroup.org>',
    'haksu+alerts@panovagroup.org',
  ]) {
    assert.equal(isAddressedToCompany({ to: mailbox }), false, mailbox);
    assert.equal(skipReason({ from: external, to: mailbox }), 'not-company', mailbox);
  }
  assert.equal(isPersonalInbox('haksu@panovagroup.org'), true);
  assert.equal(isPersonalInbox('mcitil@panovagroup.org'), true);
  assert.equal(isSharedCompanyMailbox('haksu@panovagroup.org'), false);
  assert.equal(isSharedCompanyMailbox('mcitil@panovagroup.org'), false);
});

test('mail to a personal inbox and a shared alias still forwards', () => {
  assert.equal(
    isAddressedToCompany({ to: ['haksu@panovagroup.org', company.email] }),
    true,
  );
  assert.equal(
    skipReason({ from: external, to: 'mcitil@panovagroup.org', cc: company.turkey.email }),
    null,
  );
});

test('other domain addresses are not treated as shared mailboxes', () => {
  assert.equal(isCompanyMailbox('other@panovagroup.org'), true);
  assert.equal(isCompanyMailbox('Other@PanovaGroup.org'), true);
  assert.equal(isPersonalInbox('haksu@gmail.com'), false);
  assert.equal(isSharedCompanyMailbox('other@panovagroup.org'), false);
  assert.equal(isAddressedToCompany({ to: 'other@panovagroup.org' }), false);
  assert.equal(isAddressedToCompany({ to: 'visitor@example.com' }), false);
});

test('loop prevention still drops self, auto-submitted, and already-forwarded mail', () => {
  assert.equal(skipReason({ from: company.email, to: company.email }), 'from-self');
  assert.equal(skipReason({ from: 'haksu@panovagroup.org', to: company.email }), 'from-self');
  assert.equal(skipReason({ from: 'noreply@panovagroup.org', to: company.turkey.email }), 'from-self');
  assert.equal(
    skipReason({
      from: external,
      to: company.email,
      headers: { 'Auto-Submitted': 'auto-replied' },
    }),
    'auto-submitted',
  );
  assert.equal(
    skipReason({
      from: 'mailer-daemon@example.com',
      to: company.bangladesh.email,
    }),
    'auto-submitted',
  );
  assert.equal(
    skipReason({
      from: external,
      to: company.email,
      headers: { 'X-Panova-Forwarded': 'email_123' },
    }),
    'already-forwarded',
  );
  assert.equal(
    skipReason({
      from: external,
      to: company.email,
      headers: { 'Auto-Submitted': 'no' },
    }),
    null,
  );
});

test('a homepage contact notification from the company domain is forwarded', () => {
  assert.equal(contactFormSubmissionId(contactHeader), '11111111-1111-4111-8111-111111111111');
  assert.equal(contactFormSubmissionId({ 'X-Panova-Contact-Form': 'not-a-uuid' }), null);
  assert.equal(
    skipReason({ from: company.email, to: company.email, headers: contactHeader }),
    null,
  );
  assert.equal(
    skipReason({ from: 'Panova <panova@panovagroup.org>', to: company.email, headers: contactHeader }),
    null,
  );
  assert.equal(
    skipReason({
      from: company.email,
      to: company.email,
      subject: 'Yeni iletişim formu: Ada — Panova HR',
    }),
    null,
  );
  assert.equal(
    skipReason({
      from: company.email,
      to: company.email,
      subject: '[Panova] Yeni iletişim formu: Ada',
    }),
    'from-self',
  );
  assert.equal(
    skipReason({
      from: company.email,
      to: company.email,
      headers: { ...contactHeader, 'Auto-Submitted': 'auto-generated' },
    }),
    'auto-submitted',
  );
  assert.equal(
    skipReason({
      from: company.email,
      to: company.email,
      headers: { ...contactHeader, 'X-Panova-Forwarded': 'email_123' },
    }),
    'already-forwarded',
  );
  assert.equal(
    forwardReplyAddress({
      from: `Panova <${company.email}>`,
      headers: contactHeader,
      replyTo: ['Visitor <Ada@Example.com>'],
    }),
    'ada@example.com',
  );
  assert.equal(
    forwardReplyAddress({
      from: company.email,
      headers: contactHeader,
      replyTo: [company.email],
    }),
    company.email,
  );
  assert.equal(
    forwardReplyAddress({
      from: external,
      headers: contactHeader,
      replyTo: ['other@example.com'],
    }),
    external,
  );
  assert.equal(
    forwardReplyAddress({
      from: company.email,
      subject: 'Yeni iletişim formu: Ada',
      replyTo: ['Ada@Example.com'],
    }),
    'ada@example.com',
  );
  const notice = buildForwardContent({
    from: company.email,
    to: company.email,
    subject: 'Yeni iletişim formu',
    text: 'Not',
    intro: 'Panova iletişim formu. Yanıt, formu dolduran kişiye gider.',
  });
  assert.match(notice.text, /^Panova iletişim formu/);
  assert.match(notice.html, /formu dolduran kişiye gider/);
  const ordinary = buildForwardContent({
    from: external,
    to: company.email,
    subject: 'Merhaba',
    text: 'Gövde',
  });
  assert.match(ordinary.text, /^Panova gelen kutusu iletisi/);
});
