import {
  contactMailCopy,
  emailLocale,
  employerInviteMailCopy,
  fillEmail,
  forwardMailCopy,
  inviteMailCopy,
  noticeMailCopy,
  staffRoleLabels,
  supportReplyMailCopy,
  type EmailLocale,
} from './email-copy';
import { EMAIL_FONT, EMAIL_SITE_URL, escapeHtml, portalUrl, renderLocaleEmail } from './layout';

const DATE_LOCALE: Record<EmailLocale, string> = {
  tr: 'tr-TR',
  en: 'en-GB',
  sq: 'sq-AL',
  ar: 'ar',
  mk: 'mk-MK',
};

export function formatContactSubmittedAt(date: Date, locale: EmailLocale = 'tr'): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Istanbul',
  }).format(date);
}

function detailRow(label: string, valueHtml: string, align: 'left' | 'right'): string {
  return `<p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:#0f172a;font-family:${EMAIL_FONT};text-align:${align};"><strong>${escapeHtml(label)}:</strong> ${valueHtml}</p>`;
}

export function buildContactEmail(input: {
  locale?: unknown;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  companyKey: string;
  notes: string;
  id: string;
  submittedAt: string;
}): { subject: string; html: string; text: string } {
  const locale = emailLocale(input.locale);
  const copy = contactMailCopy[locale];
  const notes = input.notes.trim() || '—';
  const align = locale === 'ar' ? 'right' : 'left';
  const subject = `${copy.subjectPrefix}: ${input.fullName} — ${input.companyName}`.replace(/[\r\n]+/g, ' ').trim().slice(0, 180);
  const rows = [
    detailRow(copy.labels.name, escapeHtml(input.fullName), align),
    detailRow(copy.labels.email, `<a href="mailto:${escapeHtml(input.email)}" style="color:#1b5e20;">${escapeHtml(input.email)}</a>`, align),
    detailRow(copy.labels.phone, escapeHtml(input.phone), align),
    detailRow(copy.labels.company, escapeHtml(input.companyName), align),
    detailRow(copy.labels.companyKey, escapeHtml(input.companyKey), align),
    detailRow(copy.labels.submitted, escapeHtml(input.submittedAt), align),
    detailRow(copy.labels.id, escapeHtml(input.id), align),
  ].join('');
  const notesHtml = `<h2 style="margin:16px 0 8px;font-size:16px;line-height:1.4;color:#0f172a;font-family:${EMAIL_FONT};text-align:${align};">${escapeHtml(copy.labels.notes)}</h2><p style="margin:0;font-size:15px;line-height:1.5;color:#0f172a;font-family:${EMAIL_FONT};text-align:${align};white-space:pre-wrap;">${escapeHtml(notes)}</p>`;
  const text = [
    copy.intro,
    '',
    `${copy.labels.name}: ${input.fullName}`,
    `${copy.labels.email}: ${input.email}`,
    `${copy.labels.phone}: ${input.phone}`,
    `${copy.labels.company}: ${input.companyName}`,
    `${copy.labels.companyKey}: ${input.companyKey}`,
    `${copy.labels.submitted}: ${input.submittedAt}`,
    `${copy.labels.id}: ${input.id}`,
    '',
    `${copy.labels.notes}:`,
    notes,
  ].join('\n');
  const rendered = renderLocaleEmail({
    locale,
    preheader: copy.preheader,
    title: copy.title,
    paragraphs: [copy.intro],
    bodyHtml: rows + notesHtml,
    text,
  });
  return { subject, html: rendered.html, text: rendered.text };
}

export function buildStaffInviteEmail(input: {
  locale?: unknown;
  name: string;
  email: string;
  role: string;
  portalUrl?: string;
}): { subject: string; html: string; text: string } {
  const locale = emailLocale(input.locale);
  const copy = inviteMailCopy[locale];
  const roleLabel = staffRoleLabels[locale][input.role] || input.role;
  const href = input.portalUrl || portalUrl();
  const hello = fillEmail(copy.hello, { name: input.name || input.email });
  const roleLine = fillEmail(copy.role, { role: roleLabel });
  const body = fillEmail(copy.body, { email: input.email });
  const text = [hello, roleLine, body, copy.ignore, `${copy.button}: ${href}`].join('\n\n');
  const rendered = renderLocaleEmail({
    locale,
    preheader: copy.preheader,
    title: copy.title,
    paragraphs: [hello, roleLine, body, copy.ignore],
    text,
    button: { href, label: copy.button },
  });
  return { subject: copy.subject, html: rendered.html, text: rendered.text };
}

export function buildEmployerInviteEmail(input: {
  locale?: unknown;
  kind: 'invite' | 'reset';
  companyName: string;
  contactName?: string;
  email: string;
  actionUrl: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const locale = emailLocale(input.locale);
  const copy = employerInviteMailCopy[locale];
  const name = input.contactName?.trim() || input.companyName.trim() || input.email;
  const company = input.companyName.trim() || input.email;
  const hello = fillEmail(copy.hello, { name });
  const body = fillEmail(input.kind === 'reset' ? copy.resetBody : copy.inviteBody, {
    company,
    email: input.email,
  });
  const google = fillEmail(copy.google, { login: input.loginUrl });
  const text = [hello, body, google, copy.ignore, `${copy.button}: ${input.actionUrl}`].join('\n\n');
  const rendered = renderLocaleEmail({
    locale,
    preheader: copy.preheader,
    title: input.kind === 'reset' ? copy.resetTitle : copy.inviteTitle,
    paragraphs: [hello, body, google, copy.ignore],
    text,
    button: { href: input.actionUrl, label: copy.button },
  });
  return {
    subject: input.kind === 'reset' ? copy.resetSubject : copy.inviteSubject,
    html: rendered.html,
    text: rendered.text,
  };
}

export function buildCandidateNoticeEmail(input: {
  locale?: unknown;
  candidateName?: string;
  subject: string;
  message: string;
}): { subject: string; html: string; text: string } {
  const locale = emailLocale(input.locale);
  const copy = noticeMailCopy[locale];
  const align = locale === 'ar' ? 'right' : 'left';
  const name = input.candidateName?.trim() || copy.fallbackName;
  const greeting = fillEmail(copy.greeting, { name });
  const safeSubject = input.subject.replace(/[\r\n]+/g, ' ').trim();
  const bodyHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8fafc" style="margin:0;background-color:#f8fafc;border-radius:14px;"><tr><td style="padding:16px;text-align:${align};"><h2 style="margin:0 0 8px;font-size:16px;line-height:1.4;color:#0f172a;font-family:${EMAIL_FONT};">${escapeHtml(safeSubject)}</h2><p style="margin:0;font-size:15px;line-height:1.5;color:#0f172a;font-family:${EMAIL_FONT};white-space:pre-wrap;">${escapeHtml(input.message)}</p></td></tr></table>`;
  const text = [greeting, copy.lead, '', safeSubject, input.message].join('\n');
  const rendered = renderLocaleEmail({
    locale,
    preheader: safeSubject || copy.preheader,
    title: copy.title,
    paragraphs: [greeting, copy.lead],
    bodyHtml,
    text,
  });
  return {
    subject: `${copy.subjectPrefix}: ${safeSubject}`.slice(0, 180),
    html: rendered.html,
    text: rendered.text,
  };
}

export function buildSupportReplyEmail(input: {
  locale?: unknown;
  candidateName?: string;
  subject: string;
  message: string;
}): { subject: string; html: string; text: string } {
  const locale = emailLocale(input.locale);
  const copy = supportReplyMailCopy[locale];
  const align = locale === 'ar' ? 'right' : 'left';
  const name = input.candidateName?.trim() || copy.fallbackName;
  const greeting = fillEmail(copy.greeting, { name });
  const safeSubject = input.subject.replace(/[\r\n]+/g, ' ').trim();
  const href = `${EMAIL_SITE_URL}/candidate`;
  const bodyHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8fafc" style="margin:0;background-color:#f8fafc;border-radius:14px;"><tr><td style="padding:16px;text-align:${align};"><h2 style="margin:0 0 8px;font-size:16px;line-height:1.4;color:#0f172a;font-family:${EMAIL_FONT};">${escapeHtml(safeSubject)}</h2><p style="margin:0;font-size:15px;line-height:1.5;color:#0f172a;font-family:${EMAIL_FONT};white-space:pre-wrap;">${escapeHtml(input.message)}</p></td></tr></table>`;
  const text = [greeting, copy.lead, '', safeSubject, input.message, '', `${copy.button}: ${href}`].join('\n');
  const rendered = renderLocaleEmail({
    locale,
    preheader: copy.preheader,
    title: copy.title,
    paragraphs: [greeting, copy.lead],
    bodyHtml,
    text,
    button: { href, label: copy.button },
  });
  return {
    subject: fillEmail(copy.subject, { subject: safeSubject }).slice(0, 180),
    html: rendered.html,
    text: rendered.text,
  };
}

export function buildTaskNoticeEmail(input: {
  locale?: unknown;
  assigneeName?: string;
  title: string;
  dueDate?: string;
  backupAssignee?: string;
  portalUrl?: string;
}): { subject: string; html: string; text: string } {
  const locale = emailLocale(input.locale);
  const copy = noticeMailCopy[locale];
  const align = locale === 'ar' ? 'right' : 'left';
  const name = input.assigneeName?.trim() || copy.fallbackAssignee;
  const hello = fillEmail(copy.taskHello, { name });
  const title = input.title.replace(/[\r\n]+/g, ' ').trim();
  const due = input.dueDate?.trim() || copy.taskUnspecified;
  const backup = input.backupAssignee?.trim() || copy.taskUnspecified;
  const href = input.portalUrl || portalUrl();
  const bodyHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8fafc" style="margin:0 0 16px;background-color:#f8fafc;border-radius:14px;"><tr><td style="padding:16px;text-align:${align};"><h2 style="margin:0 0 8px;font-size:16px;line-height:1.4;color:#0f172a;font-family:${EMAIL_FONT};">${escapeHtml(title)}</h2><p style="margin:0 0 6px;font-size:15px;line-height:1.5;color:#0f172a;font-family:${EMAIL_FONT};"><strong>${escapeHtml(copy.taskDue)}:</strong> ${escapeHtml(due)}</p><p style="margin:0;font-size:15px;line-height:1.5;color:#0f172a;font-family:${EMAIL_FONT};"><strong>${escapeHtml(copy.taskBackup)}:</strong> ${escapeHtml(backup)}</p></td></tr></table>`;
  const text = [hello, copy.taskLead, '', title, `${copy.taskDue}: ${due}`, `${copy.taskBackup}: ${backup}`, '', copy.taskAction].join('\n');
  const actionHtml = `<p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#475569;text-align:center;font-family:${EMAIL_FONT};">${escapeHtml(copy.taskAction)}</p>`;
  const rendered = renderLocaleEmail({
    locale,
    preheader: title,
    title: copy.taskTitle,
    paragraphs: [hello, copy.taskLead],
    bodyHtml: bodyHtml + actionHtml,
    text,
    button: { href, label: copy.taskButton },
  });
  return {
    subject: fillEmail(copy.taskSubject, { title }).slice(0, 180),
    html: rendered.html,
    text: rendered.text,
  };
}

export function forwardLabels(locale: EmailLocale = 'tr') {
  return forwardMailCopy[locale];
}
