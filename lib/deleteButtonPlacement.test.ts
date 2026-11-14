import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8').replace(/\r\n/g, '\n');

/** Text that follows the delete row up to the end of the card: only closing tags may come after it. */
function afterDeleteRow(source: string, marker: string): string {
  const start = source.indexOf(marker);
  assert.ok(start >= 0, `missing ${marker}`);
  const rowStart = source.lastIndexOf('<div data-delete-row', start);
  assert.ok(rowStart >= 0 && start - rowStart < 400, `${marker} is not inside a delete row`);
  const rowEnd = source.indexOf('</div>', start) + '</div>'.length;
  return source.slice(rowEnd, rowEnd + 120);
}

const ONLY_CLOSING = /^\s*(\) : null\}\s*)?(<\/div>\s*)?(\)\)\}|\);|<\/li>)/;

test('the delete button is small and secondary, in its own last row at the bottom end', () => {
  const button = read('components/portal/DeleteRecordButton.tsx');
  const cls = /DELETE_BUTTON_CLASS =\s*'([^']+)'/.exec(button)?.[1] ?? '';
  for (const c of ['border-red-300', 'bg-red-50', 'text-red-800', 'text-[11px]']) assert.ok(cls.split(' ').includes(c), `button needs ${c}`);
  assert.equal(/bg-red-600|text-white/.test(cls), false, 'no bright solid red');
  assert.match(button, /className=\{DELETE_BUTTON_CLASS\}/);
  const row = /DELETE_ROW_CLASS = '([^']+)'/.exec(button)?.[1].split(' ') ?? [];
  // 24px from the actions above (mt-3 + pt-3) with a line between, pushed to the end (left in RTL)
  for (const c of ['mt-3', 'pt-3', 'border-t', 'flex', 'justify-end']) assert.ok(row.includes(c), `row needs ${c}`);
  // the confirmation dialog and the permission check stay
  assert.match(button, /if \(!allowed \|\| !id\) return null;/);
  assert.match(button, /role="dialog" aria-modal="true"/);
});

test('employer cards: delete is the last row, not in the top button group', () => {
  const page = read('app/portal/page.tsx');
  const card = page.slice(page.indexOf('{employers.map((emp) => ('), page.indexOf('{employers.map((emp) => (') + 6000);
  const top = card.slice(0, card.indexOf('<EmployerLoginInvite'));
  assert.equal(top.includes('DeleteRecordButton'), false, 'delete left the top group');
  assert.ok(top.includes('ui.employerFile') && top.includes('ui.viewEmployerPortal'), 'file and portal buttons stay on top');
  assert.ok(card.indexOf('<EmployerLoginInvite') < card.indexOf('data-delete-row'), 'delete comes after the password-link button');
  assert.match(afterDeleteRow(card, 'table="employers"'), ONLY_CLOSING);
});

test('request, staff and candidate cards: delete is the last row of the card', () => {
  const requests = read('components/portal/RequestsTab.tsx');
  const actions = requests.slice(requests.indexOf('<div className="pt-3 border-t flex flex-col sm:flex-row gap-2">'), requests.indexOf('data-delete-row'));
  assert.equal(actions.includes('DeleteRecordButton'), false, 'delete left the action row');
  assert.match(afterDeleteRow(requests, 'table="job_requests"'), ONLY_CLOSING);

  const staff = read('components/portal/StaffTab.tsx');
  const header = staff.slice(staff.indexOf('<h4 className="min-w-0'), staff.indexOf('</h4>') + 200);
  assert.equal(header.includes('handleDeleteStaff'), false, 'delete is not next to Edit any more');
  assert.match(afterDeleteRow(staff, 'onClick={() => handleDeleteStaff(staff.id)}'), ONLY_CLOSING);
  assert.match(staff, /className=\{DELETE_BUTTON_CLASS\}>\s*<Trash2 aria-hidden[^>]*\/> \{ui\.deleteRecord\}/);

  const candidates = read('components/portal/CandidatesTab.tsx');
  const cards = candidates.slice(candidates.indexOf('data-list="candidate-cards"'), candidates.indexOf('<ScrollTable>'));
  assert.equal((cards.match(/deleteButton\(candidate, code\)/g) || []).length, 1);
  assert.ok(cards.indexOf('ui.openCandidateFile') < cards.indexOf('data-delete-row'), 'delete comes after "open file"');
  assert.match(afterDeleteRow(cards, 'deleteButton(candidate, code)'), ONLY_CLOSING);
});

test('desktop candidate table: delete is the last column, not in the referral-code cell', () => {
  const candidates = read('components/portal/CandidatesTab.tsx');
  const table = candidates.slice(candidates.indexOf('<ScrollTable>'), candidates.indexOf('</ScrollTable>'));
  assert.equal((table.match(/deleteButton\(candidate, code\)/g) || []).length, 1, 'one delete button per row');
  // header: last cell after "official process", no visible text, named for screen readers, end-aligned
  const head = table.slice(table.indexOf('<thead'), table.indexOf('</thead>'));
  const ths = head.match(/<th\b/g) || [];
  assert.ok(head.lastIndexOf('{t.officialProcessLabel}') < head.lastIndexOf('<th'), 'delete heading comes after official process');
  assert.match(head, /\{isUpperManagement \? <th className="p-4 text-end"><span className="sr-only">\{ui\.deleteRecord\}<\/span><\/th> : null\}\s*<\/tr>/);
  assert.ok(ths.length >= 9);
  // row: the referral-code cell holds only the code; delete is the last cell, end-aligned (left in RTL)
  const body = table.slice(table.indexOf('<tbody'));
  const codeCell = body.slice(body.indexOf('ui.referralCodeEmpty') - 300, body.indexOf('</td>', body.indexOf('ui.referralCodeEmpty')));
  assert.equal(codeCell.includes('deleteButton'), false, 'delete left the referral-code cell');
  assert.match(body, /<OfficialProcessBadge [^>]*\/>\s*<\/td>\s*\{isUpperManagement \? <td className="p-4 text-end" data-delete-cell>\{deleteButton\(candidate, code\)\}<\/td> : null\}\s*<\/tr>/);
  // same small secondary button, same permission and dialog
  assert.match(candidates, /allowed=\{isUpperManagement\}/);
  assert.match(read('components/portal/DeleteRecordButton.tsx'), /className=\{DELETE_BUTTON_CLASS\}/);
});
