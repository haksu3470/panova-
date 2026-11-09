import {
  EMAIL_LOCALES,
  authConfirmCopy,
  authFallback,
  authRecoveryCopy,
  emailShellCopy,
  type AuthMessageCopy,
  type EmailLocale,
} from './email-copy';
import { emailParagraph, escapeHtml, renderEmail, renderLocaleEmail } from './layout';

/** Sets $locale from user_metadata.locale. Missing metadata stays empty and uses the short fallback. */
export const LOCALE_PREAMBLE = '{{ $locale := "" }}{{ with .Data }}{{ with index . "locale" }}{{ $locale = . }}{{ end }}{{ end }}';

type AuthKind = 'confirm' | 'recovery';

function copyFor(kind: AuthKind): Record<EmailLocale, AuthMessageCopy> {
  return kind === 'confirm' ? authConfirmCopy : authRecoveryCopy;
}

function goPick(values: Record<EmailLocale, string>, fallback: string): string {
  const parts = EMAIL_LOCALES.map((locale, index) => {
    const word = index === 0 ? 'if' : 'else if';
    return `{{ ${word} eq $locale \`${locale}\` }}${escapeHtml(values[locale])}`;
  });
  return `${parts.join('')}{{ else }}${escapeHtml(fallback)}{{ end }}`;
}

function goLang(): string {
  return goPick(
    { tr: 'tr', en: 'en', sq: 'sq', ar: 'ar', mk: 'mk' },
    'und',
  );
}

function goDir(): string {
  return '{{ if eq $locale `ar` }}rtl{{ else if or (eq $locale `tr`) (eq $locale `en`) (eq $locale `sq`) (eq $locale `mk`) }}ltr{{ else }}auto{{ end }}';
}

/** Subject line to paste into the dashboard. It is a separate Go template from the body. */
export function authSubject(kind: AuthKind): string {
  const copy = copyFor(kind);
  const subjects = Object.fromEntries(EMAIL_LOCALES.map((locale) => [locale, copy[locale].subject])) as Record<EmailLocale, string>;
  return `${LOCALE_PREAMBLE}${goPick(subjects, 'Panova')}`;
}

function bodySwitch(kind: AuthKind): string {
  const copy = copyFor(kind);
  const lines = kind === 'confirm' ? authFallback.confirmLines : authFallback.recoveryLines;
  const parts = EMAIL_LOCALES.map((locale, index) => {
    const word = index === 0 ? 'if' : 'else if';
    return `{{ ${word} eq $locale \`${locale}\` }}${emailParagraph(escapeHtml(copy[locale].body))}`;
  });
  const fallback = emailParagraph(lines.map((line) => escapeHtml(line)).join('<br>'));
  return `${parts.join('')}{{ else }}${fallback}{{ end }}`;
}

const FILE_NOTES: Record<'confirmation' | 'magic_link' | 'recovery', string> = {
  confirmation: `Supabase Dashboard → Authentication → Emails → Templates → Confirm signup
  Subject: supabase/templates/README.md (Confirm signup).
  Hosted projects do not read this file. Paste the subject and this body into that template.
  Locale is user_metadata.locale, saved at sign-up as options.data.locale.`,
  magic_link: `Supabase Dashboard → Authentication → Emails → Templates → Magic Link
  Subject: supabase/templates/README.md (Magic Link). Same subject and body as Confirm signup.
  Resend uses this template when the signup message cannot be sent again.`,
  recovery: `Supabase Dashboard → Authentication → Emails → Templates → Reset password
  Subject: supabase/templates/README.md (Reset password).
  Hosted projects do not read this file. Paste the subject and this body into that template.
  The link sends the user to /auth/reset-password/candidate, /auth/reset-password/employer,
  or /auth/reset-password/portal. Allow those paths under Authentication → URL Configuration:
  https://panovagroup.org/auth/reset-password/**
  http://localhost:3000/auth/reset-password/**`,
};

export function renderAuthTemplate(file: 'confirmation' | 'magic_link' | 'recovery'): string {
  const kind: AuthKind = file === 'recovery' ? 'recovery' : 'confirm';
  const copy = copyFor(kind);
  const pick = (read: (locale: EmailLocale) => string, fallback: string) => goPick(
    Object.fromEntries(EMAIL_LOCALES.map((locale) => [locale, read(locale)])) as Record<EmailLocale, string>,
    fallback,
  );
  const { html } = renderEmail({
    lang: goLang(),
    dir: goDir(),
    preheader: pick((locale) => copy[locale].preheader, authFallback.preheader),
    title: pick((locale) => copy[locale].title, authFallback.title),
    bodyHtml: bodySwitch(kind),
    text: '',
    otp: { html: '{{ .Token }}', text: '{{ .Token }}' },
    button: {
      href: '{{ .ConfirmationURL }}',
      label: pick((locale) => copy[locale].button, authFallback.button),
      textLabel: '',
    },
    places: pick((locale) => emailShellCopy[locale].places, authFallback.places),
    automated: pick((locale) => emailShellCopy[locale].automated, authFallback.automated),
    footerAlign: '{{ if eq $locale `ar` }}right{{ else }}left{{ end }}',
  });
  return `<!--\n  ${FILE_NOTES[file]}\n-->\n${LOCALE_PREAMBLE}\n${html}`;
}

/** Concrete card for one locale. Used to preview the shell without the Go conditionals. */
export function renderAuthPreview(kind: AuthKind, locale: EmailLocale, token = '917346', href = 'https://panovagroup.org/candidate'): string {
  const copy = copyFor(kind)[locale];
  return renderLocaleEmail({
    locale,
    preheader: copy.preheader,
    title: copy.title,
    paragraphs: [copy.body],
    text: [copy.preheader, copy.title, copy.body, token, `${copy.button}: ${href}`].join('\n'),
    otp: token,
    button: { href, label: copy.button },
  }).html;
}

export function authTemplateSources(): Record<'confirmation' | 'magic_link' | 'recovery', string> {
  return {
    confirmation: renderAuthTemplate('confirmation'),
    magic_link: renderAuthTemplate('magic_link'),
    recovery: renderAuthTemplate('recovery'),
  };
}
