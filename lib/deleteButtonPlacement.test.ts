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
