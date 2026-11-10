import type { Language } from './dictionary';

/**
 * Support ticket status and who may read or write a message.
 * The SQL policies in supabase/migrations/20261110170000_support_ticket_messages.sql
 * follow the same rules. Closed tickets accept no candidate or employer follow-up.
 */

export type SupportStatus = 'open' | 'answered' | 'closed';

export type SupportAuthorRole = 'staff' | 'candidate' | 'employer';

export type SupportMessage = {
  id: string;
  ticket_id: string;
  author_role: string;
  author_name?: string | null;
  body: string;
  created_at: string;
  read_at?: string | null;
};

export type SupportTicketThread = {
  id: string;
  subject?: string | null;
  status?: string | null;
  message?: string | null;
  admin_reply?: string | null;
  replied_at?: string | null;
  replied_by_name?: string | null;
  created_at?: string | null;
};

/** open, answered, and closed are the stored values. Anything else stays open. */
export function supportTicketStatus(status: string | null | undefined): SupportStatus {
  const key = String(status ?? '').trim().toLowerCase();
  if (key === 'answered') return 'answered';
  if (key === 'closed') return 'closed';
  return 'open';
}

export function supportStatusTone(status: string | null | undefined): string {
  const key = supportTicketStatus(status);
  if (key === 'answered') return 'bg-status-ok-bg text-status-ok';
  if (key === 'closed') return 'bg-slate-200 text-foreground';
  return 'bg-status-pending-bg text-status-pending';
}

export function canFollowUp(status: string | null | undefined): boolean {
  return supportTicketStatus(status) !== 'closed';
}

export type TicketAccess = {
  isStaff: boolean;
  isPortalManager: boolean;
  candidateId: string | null;
  employerId: string | null;
  myCandidateId: string | null;
  myEmployerId: string | null;
  canReadCandidate: boolean;
  canReadEmployer: boolean;
  emailAccessOk: boolean;
};

export function candidateOwnsTicket(access: TicketAccess): boolean {
  return Boolean(
    access.emailAccessOk
    && access.myCandidateId
    && access.candidateId
    && access.myCandidateId === access.candidateId,
  );
}

export function employerOwnsTicket(access: TicketAccess): boolean {
  return Boolean(
    access.emailAccessOk
    && access.myEmployerId
    && access.employerId
    && access.candidateId == null
    && access.myEmployerId === access.employerId,
  );
}

/** Same gate as staff_select_tickets: manager, or the candidate/employer read scope. */
export function staffMayReadTicket(access: TicketAccess): boolean {
  if (!access.isStaff) return false;
  if (access.isPortalManager) return true;
  if (access.candidateId && access.canReadCandidate) return true;
  if (access.employerId && access.canReadEmployer) return true;
  return false;
}

export function mayReadSupportMessages(access: TicketAccess): boolean {
  return staffMayReadTicket(access) || candidateOwnsTicket(access) || employerOwnsTicket(access);
}

/** Staff may always write a ticket they can read. Owners may write only while it is open or answered. */
export function mayWriteSupportMessage(access: TicketAccess, role: SupportAuthorRole, status: string | null | undefined): boolean {
  if (role === 'staff') return staffMayReadTicket(access);
  if (!canFollowUp(status)) return false;
  if (role === 'candidate') return candidateOwnsTicket(access);
  return employerOwnsTicket(access);
}

export function threadForTicket(ticket: SupportTicketThread, messages: SupportMessage[]): SupportMessage[] {
  const rows = messages
    .filter((message) => message.ticket_id === ticket.id && message.body.trim())
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const legacy = ticket.admin_reply?.trim();
  if (!legacy) return rows;
  const lastStaff = [...rows].reverse().find((message) => message.author_role === 'staff');
  if (lastStaff?.body.trim() === legacy) return rows;
  return [...rows, {
    id: `legacy-${ticket.id}`,
    ticket_id: ticket.id,
    author_role: 'staff',
    author_name: ticket.replied_by_name || null,
    body: legacy,
    created_at: ticket.replied_at || ticket.created_at || '',
    read_at: null,
  }];
}

export function ticketHasUnreadStaff(ticket: SupportTicketThread, messages: SupportMessage[]): boolean {
  if (supportTicketStatus(ticket.status) === 'closed') return false;
  const rows = messages.filter((message) => message.ticket_id === ticket.id);
  if (rows.length === 0) {
    return supportTicketStatus(ticket.status) === 'answered' && Boolean(ticket.admin_reply?.trim());
  }
  return rows.some((message) => message.author_role === 'staff' && !message.read_at);
}

/** Open tickets, plus answered tickets the candidate has not read. Closed tickets stay out. */
export function supportBadgeCount(tickets: SupportTicketThread[], messages: SupportMessage[]): number {
  return tickets.filter((ticket) => {
    const status = supportTicketStatus(ticket.status);
    if (status === 'closed') return false;
    if (status === 'open') return true;
    return ticketHasUnreadStaff(ticket, messages);
  }).length;
}

export function supportReplyIdempotencyKey(ticketId: string, repliedAt: string): string {
  const stamp = repliedAt.replace(/\D/g, '') || '0';
  return `support-reply/${ticketId}/${stamp}`;
}

export type SupportThreadCopy = {
  myRequests: string;
  noRequests: string;
  original: string;
  staff: string;
  you: string;
  followUp: string;
  followUpPh: string;
  followUpSend: string;
  closedNote: string;
  replyFailed: string;
};

export const supportThreadCopy: Record<Language, SupportThreadCopy> = {
  tr: {
    myRequests: 'Taleplerim',
    noRequests: 'Henüz bir destek talebiniz yok.',
    original: 'Mesajınız',
    staff: 'Personel',
    you: 'Siz',
    followUp: 'Yanıt yazın',
    followUpPh: 'Ek bilgi yazın',
    followUpSend: 'Gönder',
    closedNote: 'Bu talep kapatıldı.',
    replyFailed: 'Yanıt kaydedilemedi. Tekrar deneyin.',
  },
  en: {
    myRequests: 'My requests',
    noRequests: 'You have no support requests yet.',
    original: 'Your message',
    staff: 'Staff',
    you: 'You',
    followUp: 'Write a follow-up',
    followUpPh: 'Add more detail',
    followUpSend: 'Send',
    closedNote: 'This request is closed.',
    replyFailed: 'The reply could not be saved. Try again.',
  },
  mk: {
    myRequests: 'Мои барања',
    noRequests: 'Сè уште немате барања за поддршка.',
    original: 'Вашата порака',
    staff: 'Персонал',
    you: 'Вие',
    followUp: 'Напишете дополнување',
    followUpPh: 'Додадете уште детали',
    followUpSend: 'Испрати',
    closedNote: 'Ова барање е затворено.',
    replyFailed: 'Одговорот не можеше да се зачува. Обидете се повторно.',
  },
  sq: {
    myRequests: 'Kërkesat e mia',
    noRequests: 'Nuk keni ende kërkesa mbështetjeje.',
    original: 'Mesazhi juaj',
    staff: 'Stafi',
    you: 'Ju',
    followUp: 'Shkruani një vazhdim',
    followUpPh: 'Shtoni më shumë detaje',
    followUpSend: 'Dërgo',
    closedNote: 'Kjo kërkesë është e mbyllur.',
    replyFailed: 'Përgjigjja nuk u ruajt. Provoni përsëri.',
  },
  ar: {
    myRequests: 'طلباتي',
    noRequests: 'لا توجد طلبات دعم بعد.',
    original: 'رسالتكم',
    staff: 'الموظفون',
    you: 'أنتم',
    followUp: 'أضيفوا ردًا',
    followUpPh: 'أضيفوا مزيدًا من التفاصيل',
    followUpSend: 'إرسال',
    closedNote: 'هذا الطلب مغلق.',
    replyFailed: 'تعذر حفظ الرد. حاولوا مرة أخرى.',
  },
};
