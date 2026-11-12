'use client';

import { useState, type FormEvent } from 'react';
import type { Language } from '@/lib/dictionary';
import { dateLocale } from '@/lib/portal-ui-copy';
import { supportStatusLabel, type ReleaseCopy } from '@/lib/release-copy';
import {
  canFollowUp,
  supportStatusTone,
  supportThreadCopy,
  threadForTicket,
  type SupportMessage,
  type SupportTicketThread,
} from '@/lib/supportTickets';

export function SupportRequestList({
  lang,
  tickets,
  messages,
  statusCopy,
  onFollowUp,
}: {
  lang: Language;
  tickets: SupportTicketThread[];
  messages: SupportMessage[];
  statusCopy: ReleaseCopy;
  onFollowUp: (ticketId: string, body: string) => Promise<void>;
}) {
  const copy = supportThreadCopy[lang];
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');

  const send = async (event: FormEvent<HTMLFormElement>, ticketId: string) => {
    event.preventDefault();
    const body = (drafts[ticketId] || '').trim();
    if (!body || busyId) return;
    setBusyId(ticketId);
    try {
      await onFollowUp(ticketId, body);
      setDrafts((current) => ({ ...current, [ticketId]: '' }));
    } finally {
      setBusyId('');
    }
  };

  return (
    <section className="space-y-3 text-left rtl:text-right" aria-labelledby="my-requests-heading">
      <h4 id="my-requests-heading" className="text-sm font-extrabold text-foreground">{copy.myRequests}</h4>
      {tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.noRequests}</p>
      ) : (
        <ul className="space-y-3">
          {tickets.map((ticket) => {
            const thread = threadForTicket(ticket, messages);
            const open = canFollowUp(ticket.status);
            return (
              <li key={ticket.id} className="rounded-2xl border border-line bg-slate-50 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-foreground">{ticket.subject || copy.myRequests}</p>
                  <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${supportStatusTone(ticket.status)}`}>
                    {supportStatusLabel(ticket.status, statusCopy)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {ticket.created_at ? new Date(ticket.created_at).toLocaleString(dateLocale[lang]) : ''}
                </p>
                <div>
                  <p className="text-xs font-bold text-foreground">{copy.original}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{ticket.message}</p>
                </div>
                {thread.length > 0 ? (
                  <ol className="space-y-2">
                    {thread.map((message) => {
                      const mine = message.author_role !== 'staff';
                      return (
                        <li key={message.id} className="rounded-xl border border-line bg-card px-3 py-2">
                          <p className="text-xs font-bold text-foreground">
                            {mine ? copy.you : (message.author_name || copy.staff)}
                            {message.created_at ? (
                              <span className="ms-2 font-semibold text-muted-foreground">
                                {new Date(message.created_at).toLocaleString(dateLocale[lang])}
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{message.body}</p>
                        </li>
                      );
                    })}
                  </ol>
                ) : null}
                {open ? (
                  <form onSubmit={(event) => { void send(event, ticket.id); }} className="space-y-2">
                    <label htmlFor={`follow-up-${ticket.id}`} className="block text-xs font-bold text-foreground">{copy.followUp}</label>
                    <textarea
                      id={`follow-up-${ticket.id}`}
                      value={drafts[ticket.id] || ''}
                      onChange={(event) => setDrafts((current) => ({ ...current, [ticket.id]: event.target.value }))}
                      rows={3}
                      required
                      placeholder={copy.followUpPh}
                      className="w-full rounded-xl border border-line bg-card px-3 py-2 text-sm text-foreground"
                    />
                    <button
                      type="submit"
                      disabled={busyId === ticket.id}
                      className="rounded-xl bg-brand-solid px-4 py-2 text-sm font-bold text-white cursor-pointer disabled:bg-disabled disabled:text-on-dark disabled:opacity-100"
                    >
                      {copy.followUpSend}
                    </button>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">{copy.closedNote}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
