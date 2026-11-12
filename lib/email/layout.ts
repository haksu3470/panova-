import { company } from '../company';
import type { EmailLocale } from './email-copy';
import { emailDir, emailShellCopy } from './email-copy';

/** Absolute logo. Email clients do not load the site-relative /logo.png path. */
export const EMAIL_LOGO_URL = 'https://panovagroup.org/logo.png';

export const EMAIL_SITE_URL = 'https://panovagroup.org';

export const EMAIL_FONT = "Arial,Helvetica,sans-serif";

export const emailParagraphStyle = `margin:0 0 16px;font-size:15px;line-height:1.5;color:#475569;text-align:center;font-family:${EMAIL_FONT};`;

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c
  ));
}

export function emailParagraph(escapedText: string): string {
  return `<p style="${emailParagraphStyle}">${escapedText}</p>`;
}

export function portalUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base = (configured || EMAIL_SITE_URL).replace(/\/+$/, '');
  return `${base}/portal`;
}

export type EmailButton = {
  href: string;
  /** Already escaped, or a Go template action. */
  label: string;
};

export type EmailDocument = {
  lang: string;
  /** ltr, rtl, auto, or a Go template action that resolves to one of those. */
  dir: string;
  /** Already escaped, or a Go template action. */
  preheader: string;
  title: string;
  /** Trusted HTML under the heading. */
  bodyHtml: string;
  /** Plain-text body, without the shell. */
  text: string;
  otp?: { html: string; text: string };
  button?: EmailButton & { textLabel: string };
  places: string;
  automated: string;
  /** left, right, or a Go template action that resolves to one of those. */
  footerAlign?: string;
};

function otpBox(codeHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ecfdf5" style="margin:0;background-color:#ecfdf5;border:2px dashed #2e7d32;border-radius:14px;"><tr><td align="center" style="padding:22px 12px;text-align:center;"><span style="font-size:40px;line-height:1.2;letter-spacing:8px;font-weight:800;color:#14532d;font-family:Consolas,'Courier New',Courier,monospace;-webkit-user-select:text;user-select:text;">${codeHtml}</span></td></tr></table>`;
}

function bulletproofButton(button: EmailButton): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:20px auto 0;"><tr><td align="center" bgcolor="#1b5e20" style="border-radius:999px;background-color:#1b5e20;"><a href="${button.href}" style="display:inline-block;background-color:#1b5e20;color:#ffffff;text-decoration:none;font-weight:700;font-family:${EMAIL_FONT};font-size:15px;line-height:1.2;padding:14px 26px;border-radius:999px;mso-padding-alt:0;">${button.label}</a></td></tr></table>`;
}

/**
 * One corporate card for every message the site sends.
 * Table layout and inline CSS so Gmail and Outlook keep the card, the code, and the footer.
 * Callers pass escaped text. Go template actions are inserted as trusted strings.
 */
export function renderEmail(doc: EmailDocument): { html: string; text: string } {
  const footerAlign = doc.footerAlign ?? (doc.dir === 'rtl' ? 'right' : 'left');
  const preheaderPad = '&nbsp;&zwnj;'.repeat(8);
  const otp = doc.otp ? otpBox(doc.otp.html) : '';
  const button = doc.button ? bulletproofButton(doc.button) : '';
  const html = `<!DOCTYPE html>
<html lang="${doc.lang}" dir="${doc.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<title>${doc.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;">
<div lang="${doc.lang}" dir="${doc.dir}" style="background-color:#0f172a;margin:0;padding:0;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#0f172a;opacity:0;">${doc.preheader}${preheaderPad}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f172a" style="background-color:#0f172a;margin:0;padding:0;">
<tr>
<td align="center" style="padding:24px 12px;">
<!--[if mso]><table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:20px;overflow:hidden;">
<tr>
<td align="center" style="padding:28px 28px 8px;text-align:center;font-family:${EMAIL_FONT};">
<a href="${EMAIL_SITE_URL}" style="text-decoration:none;">
<img src="${EMAIL_LOGO_URL}" alt="Panova Group" width="120" style="display:block;margin:0 auto 12px;border:0;outline:none;text-decoration:none;max-width:120px;height:auto;">
</a>
<p style="margin:0;font-size:13px;line-height:1.4;color:#64748b;font-family:${EMAIL_FONT};">Panova Group HR</p>
</td>
</tr>
<tr>
<td style="padding:8px 28px 28px;font-family:${EMAIL_FONT};text-align:center;">
<h1 style="margin:16px 0 10px;font-size:24px;line-height:1.3;color:#0f172a;font-weight:800;font-family:${EMAIL_FONT};text-align:center;">${doc.title}</h1>
${doc.bodyHtml}
${otp}
${button}
</td>
</tr>
<tr>
<td bgcolor="#f1f5f9" style="padding:18px 28px;background-color:#f1f5f9;font-family:${EMAIL_FONT};font-size:12px;line-height:1.5;color:#334155;text-align:${footerAlign};">
© Panova Group · ${doc.places}<br>
<a href="mailto:${company.email}" style="color:#1b5e20;text-decoration:underline;">${company.email}</a>
 · <a href="${EMAIL_SITE_URL}" style="color:#1b5e20;text-decoration:underline;">panovagroup.org</a><br>
${doc.automated}
</td>
</tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td>
</tr>
</table>
</div>
</body>
</html>`;

  const lines = [
    doc.text,
    doc.otp ? doc.otp.text : '',
    doc.button ? `${doc.button.textLabel}: ${doc.button.href}` : '',
    '',
    `Panova Group · ${company.email} · ${EMAIL_SITE_URL}`,
  ].filter((line) => line !== '');

  return { html, text: lines.join('\n') };
}

/** Concrete locale shell. Text arguments are escaped here. */
export function renderLocaleEmail(input: {
  locale: EmailLocale;
  preheader: string;
  title: string;
  paragraphs: string[];
  bodyHtml?: string;
  text: string;
  otp?: string;
  button?: { href: string; label: string };
}): { html: string; text: string } {
  const shell = emailShellCopy[input.locale];
  const paragraphs = input.paragraphs.map((paragraph) => emailParagraph(escapeHtml(paragraph))).join('');
  return renderEmail({
    lang: input.locale,
    dir: emailDir(input.locale),
    preheader: escapeHtml(input.preheader),
    title: escapeHtml(input.title),
    bodyHtml: `${paragraphs}${input.bodyHtml ?? ''}`,
    text: input.text,
    otp: input.otp ? { html: escapeHtml(input.otp), text: input.otp } : undefined,
    button: input.button
      ? { href: escapeHtml(input.button.href), label: escapeHtml(input.button.label), textLabel: input.button.label }
      : undefined,
    places: escapeHtml(shell.places),
    automated: escapeHtml(shell.automated),
  });
}
