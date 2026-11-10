import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
import {
  canFollowUp,
  candidateOwnsTicket,
  employerOwnsTicket,
  mayReadSupportMessages,
  mayWriteSupportMessage,
  staffMayReadTicket,
  supportBadgeCount,
  supportReplyIdempotencyKey,
  supportThreadCopy,
  supportTicketStatus,
  threadForTicket,
  type TicketAccess,
} from './supportTickets.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);
const { releaseCopy, supportStatusLabel } = await import('./release-copy.ts');

const own: TicketAccess = {
  isStaff: false,
  isPortalManager: false,
  candidateId: 'cand-1',
  employerId: null,
  myCandidateId: 'cand-1',
  myEmployerId: null,
  canReadCandidate: false,
  canReadEmployer: false,
  emailAccessOk: true,
};

const other: TicketAccess = { ...own, myCandidateId: 'cand-2' };

const officer: TicketAccess = {
  ...own,
  isStaff: true,
  myCandidateId: null,
  canReadCandidate: true,
};

test('request list copy exists in TR, EN, MK, SQ, and AR', () => {
  const keys = Object.keys(supportThreadCopy.tr).sort();
  assert.deepEqual(Object.keys(supportThreadCopy.en).sort(), keys);
  assert.deepEqual(Object.keys(supportThreadCopy.mk).sort(), keys);
  assert.deepEqual(Object.keys(supportThreadCopy.sq).sort(), keys);
  assert.deepEqual(Object.keys(supportThreadCopy.ar).sort(), keys);
  assert.equal(supportThreadCopy.tr.myRequests, 'Taleplerim');
  assert.equal(supportThreadCopy.en.myRequests, 'My requests');
  assert.match(supportThreadCopy.mk.myRequests, /[А-Яа-я]/);
  assert.match(supportThreadCopy.ar.myRequests, /طلباتي/);
});

test('stored ticket statuses map to Open, Answered, and Closed', () => {
  assert.equal(supportTicketStatus('open'), 'open');
  assert.equal(supportTicketStatus(' Open '), 'open');
  assert.equal(supportTicketStatus('pending'), 'open');
  assert.equal(supportTicketStatus(null), 'open');
  assert.equal(supportTicketStatus('answered'), 'answered');
  assert.equal(supportTicketStatus('ANSWERED'), 'answered');
  assert.equal(supportTicketStatus('closed'), 'closed');
  assert.equal(supportTicketStatus('Closed'), 'closed');

  assert.equal(supportStatusLabel('open', releaseCopy.en), 'Open');
  assert.equal(supportStatusLabel('answered', releaseCopy.en), 'Answered');
  assert.equal(supportStatusLabel('closed', releaseCopy.en), 'Closed');
  assert.equal(supportStatusLabel('pending', releaseCopy.tr), 'Açık');
  assert.equal(supportStatusLabel('answered', releaseCopy.mk), releaseCopy.mk.statusAnswered);
  assert.equal(supportStatusLabel('closed', releaseCopy.ar), releaseCopy.ar.statusClosed);
  assert.equal(supportStatusLabel('open', releaseCopy.sq), releaseCopy.sq.statusOpen);
  assert.equal(canFollowUp('answered'), true);
  assert.equal(canFollowUp('closed'), false);
});

test('a candidate reads and writes only their own open ticket', () => {
  assert.equal(candidateOwnsTicket(own), true);
  assert.equal(candidateOwnsTicket({ ...own, emailAccessOk: false }), false);
  assert.equal(candidateOwnsTicket(other), false);
  assert.equal(mayReadSupportMessages(own), true);
  assert.equal(mayReadSupportMessages(other), false);
  assert.equal(mayWriteSupportMessage(own, 'candidate', 'answered'), true);
  assert.equal(mayWriteSupportMessage(own, 'candidate', 'closed'), false);
  assert.equal(mayWriteSupportMessage(own, 'staff', 'open'), false);
  assert.equal(mayWriteSupportMessage(other, 'candidate', 'open'), false);
});

test('staff read scope matches the ticket policies, and a manager reads every ticket', () => {
  assert.equal(staffMayReadTicket(officer), true);
  assert.equal(staffMayReadTicket({ ...officer, canReadCandidate: false, candidateId: 'cand-1', employerId: null }), false);
  assert.equal(staffMayReadTicket({ ...officer, isPortalManager: true, canReadCandidate: false }), true);
  assert.equal(staffMayReadTicket({ ...officer, isStaff: false, isPortalManager: true }), false);
  const employerTicket: TicketAccess = {
    ...officer,
    candidateId: null,
    employerId: 'emp-1',
    canReadCandidate: false,
    canReadEmployer: true,
  };
  assert.equal(staffMayReadTicket(employerTicket), true);
  assert.equal(mayWriteSupportMessage(employerTicket, 'staff', 'closed'), true);
  assert.equal(employerOwnsTicket({
    ...own,
    isStaff: false,
    candidateId: null,
    employerId: 'emp-1',
    myCandidateId: null,
    myEmployerId: 'emp-1',
  }), true);
  assert.equal(mayWriteSupportMessage({
    ...own,
    candidateId: null,
    employerId: 'emp-1',
    myCandidateId: null,
    myEmployerId: 'emp-9',
  }, 'employer', 'open'), false);
});

test('the thread keeps the original reply and the badge counts open or unread tickets', () => {
  const ticket = {
    id: 't1',
    status: 'answered',
    admin_reply: 'Water is back.',
    replied_at: '2026-11-10T08:00:00.000Z',
    replied_by_name: 'Ayse',
    created_at: '2026-11-09T08:00:00.000Z',
  };
  const legacy = threadForTicket(ticket, []);
  assert.equal(legacy.length, 1);
  assert.equal(legacy[0].author_role, 'staff');
  assert.equal(legacy[0].body, 'Water is back.');

  const stored = threadForTicket(ticket, [{
    id: 'm1',
    ticket_id: 't1',
    author_role: 'staff',
    body: 'Water is back.',
    created_at: '2026-11-10T08:00:00.000Z',
    read_at: null,
  }]);
  assert.equal(stored.length, 1);

  const open = { id: 't2', status: 'open', admin_reply: null };
  const read = { id: 't3', status: 'answered', admin_reply: 'Done', created_at: '2026-11-01T00:00:00.000Z' };
  const closed = { id: 't4', status: 'closed', admin_reply: 'Done' };
  const messages = [{
    id: 'm3',
    ticket_id: 't3',
    author_role: 'staff',
    body: 'Done',
    created_at: '2026-11-02T00:00:00.000Z',
    read_at: '2026-11-03T00:00:00.000Z',
  }];
  assert.equal(supportBadgeCount([ticket, open, read, closed], messages), 2);
  assert.equal(supportReplyIdempotencyKey('t1', '2026-11-10T08:00:00.000Z'), 'support-reply/t1/20261110080000000');
});
