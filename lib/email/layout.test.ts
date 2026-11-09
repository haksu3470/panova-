import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';

register(new URL('./resolve-at.mjs', import.meta.url).href, import.meta.url);

const { authSubject, authTemplateSources, renderAuthPreview } = await import('./auth-templates.ts');
const { buildCandidateNoticeEmail, buildStaffInviteEmail, buildTaskNoticeEmail } = await import('./app-messages.ts');
const { EMAIL_LOCALES, contactSubjectPrefixes, emailShellCopy } = await import('./email-copy.ts');
const { EMAIL_LOGO_URL } = await import('./layout.ts');

const root = new URL('../../', import.meta.url);

test('every locale has the same email copy shape', () => {
  const keys = (value: object) => JSON.stringify(Object.keys(value));
  for (const locale of EMAIL_LOCALES) {
    assert.equal(keys(emailShellCopy[locale]), keys(emailShellCopy.tr));
    assert.ok(emailShellCopy[locale].automated);
    assert.ok(emailShellCopy[locale].places);
  }
  assert.equal(contactSubjectPrefixes().length, EMAIL_LOCALES.length);
});

test('a known locale renders one language inside the corporate card', () => {
  const html = renderAuthPreview('confirm', 'en');
  assert.match(html, new RegExp(EMAIL_LOGO_URL.replace(/[.]/g, '\\.')));
  assert.match(html, /lang="en"/);
  assert.match(html, /dir="ltr"/);
  assert.match(html, /Your security code/);
  assert.match(html, /917346/);
  assert.match(html, /font-family:Consolas/);
  assert.match(html, /border:2px dashed #2e7d32/);
  assert.match(html, /panova@panovagroup\.org/);
  assert.match(html, /This message was sent automatically/);
  assert.match(html, /role="presentation"/);
  assert.equal(html.includes('Güvenlik kodunuz'), false);
  assert.equal(html.includes('رمز الأمان'), false);
  assert.equal(html.includes('<script'), false);

  const arabic = renderAuthPreview('recovery', 'ar', '654321');
  assert.match(arabic, /lang="ar"/);
  assert.match(arabic, /dir="rtl"/);
  assert.match(arabic, /أعد تعيين كلمة المرور/);
  assert.match(arabic, /654321/);
  assert.equal(arabic.includes('Reset your password'), false);
});

test('repo auth templates match the shared shell and branch on locale', () => {
  const sources = authTemplateSources();
  for (const [name, html] of Object.entries(sources)) {
    const onDisk = readFileSync(new URL(`supabase/templates/${name}.html`, root), 'utf8');
    assert.equal(onDisk, html, name);
    assert.match(html, /https:\/\/panovagroup\.org\/logo\.png/);
    assert.equal(html.includes('{{ .Token }}'), true);
    assert.equal(html.includes('{{ .ConfirmationURL }}'), true);
    assert.match(html, /eq \$locale `en`/);
    assert.match(html, /eq \$locale `ar`/);
    assert.match(html, /Enter the code or open the link|Enter the code to reset your password/);
    assert.equal((html.match(/<h1 /g) || []).length, 1);
    assert.equal(html.includes('<script'), false);
  }
  const confirmSubject = authSubject('confirm');
  const recoverySubject = authSubject('recovery');
  const readme = readFileSync(new URL('supabase/templates/README.md', root), 'utf8');
  assert.equal(readme.includes(confirmSubject), true);
  assert.equal(readme.includes(recoverySubject), true);
  assert.equal(confirmSubject.includes('{{ .Token }}'), false);
});

test('app emails share the card and follow the requested locale', () => {
  const invite = buildStaffInviteEmail({
    locale: 'mk',
    name: 'Ана',
    email: 'ana@example.com',
    role: 'field_officer',
    portalUrl: 'https://panovagroup.org/portal',
  });
  assert.match(invite.subject, /Покана/);
  assert.match(invite.html, /Теренски службеник/);
  assert.match(invite.html, /https:\/\/panovagroup\.org\/logo\.png/);
  assert.equal(invite.html.includes('Üst Yönetim'), false);
  assert.match(invite.text, /ana@example.com/);

  const notice = buildCandidateNoticeEmail({
    locale: 'en',
    candidateName: 'Ada <b>',
    subject: 'Interview',
    message: 'Line one\n<script>',
  });
  assert.match(notice.subject, /^Panova notice: Interview/);
  assert.match(notice.html, /Ada &lt;b&gt;/);
  assert.match(notice.html, /&lt;script&gt;/);
  assert.equal(notice.html.includes('<script>'), false);

  const task = buildTaskNoticeEmail({
    locale: 'sq',
    title: 'Dosja',
    assigneeName: 'Besa',
    dueDate: '12 maj',
  });
  assert.match(task.html, /Detyrë e re|U caktua një detyrë e re/);
  assert.match(task.html, /12 maj/);
  assert.match(task.html, /https:\/\/panovagroup\.org\/portal/);
});
