import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

register(new URL('./resolve-at.mjs', import.meta.url).href, import.meta.url);

const { buildSupportReplyEmail } = await import('./app-messages.ts');
const { NOREPLY_FROM } = await import('./forward-inbound.ts');
const { supportReplyMailCopy } = await import('./email-copy.ts');

test('a staff reply uses the corporate card from noreply in the candidate language', () => {
  assert.equal(NOREPLY_FROM, 'Panova <noreply@panovagroup.org>');
  const message = buildSupportReplyEmail({
    locale: 'mk',
    candidateName: 'Ана',
    subject: 'Сместување',
    message: 'Водата е вратена.',
  });
  assert.match(message.subject, /Одговор за поддршка/);
  assert.match(message.subject, /Сместување/);
  assert.match(message.html, /lang="mk"/);
  assert.match(message.html, /https:\/\/panovagroup\.org\/logo\.png/);
  assert.match(message.html, /https:\/\/panovagroup\.org\/candidate/);
  assert.match(message.html, /Водата е вратена/);
  assert.match(message.text, /Ана/);
  assert.equal(message.html.includes('<script'), false);
  assert.equal(message.html.includes('Taleplerim'), false);

  const arabic = buildSupportReplyEmail({
    locale: 'ar',
    subject: 'الجواز',
    message: 'تم الاستلام',
  });
  assert.match(arabic.html, /dir="rtl"/);
  assert.match(arabic.html, /طلباتي/);
  assert.equal(Object.keys(supportReplyMailCopy).join(','), 'tr,en,sq,ar,mk');
});
