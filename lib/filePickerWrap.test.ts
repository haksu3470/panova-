import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

test('the file picker takes a whole row and lets the file name drop under the button', () => {
  const picker = read('components/site/FilePicker.tsx');
  assert.match(picker, /<div className="flex min-w-0 max-w-full flex-1 basis-full flex-wrap items-center gap-x-2 gap-y-1">/);
  // a chosen name keeps a minimum width next to the button, otherwise it wraps, and is cut with an ellipsis;
  // "no file chosen" keeps its full width (shrink-0) so it moves under the button instead of being cut
  assert.match(picker, /className=\{`max-w-full truncate text-xs text-muted-foreground \$\{fileName \? 'min-w-\[6rem\] flex-1 basis-24' : 'shrink-0'\}`\}/);
  assert.match(picker, /title=\{fileName \|\| undefined\}/);
  // the button itself never gets wider than the row
  assert.match(picker, /inline-flex max-w-full shrink-0 items-center/);
  // keyboard and screen reader: real input inside the label, sr-only, described by the status text
  assert.match(picker, /<label\s+htmlFor=\{id\}/);
  assert.match(picker, /className="sr-only"/);
  assert.match(picker, /aria-describedby=\{statusId\}/);
});

test('document rows wrap: picker on its own row, preview and download below', () => {
  const page = read('app/candidate/page.tsx');
  const row = /<div className="flex flex-wrap items-center gap-2" data-row="doc-actions">\s*<FilePicker/;
  assert.match(page, row);
  const start = page.indexOf('data-row="doc-actions"');
  const block = page.slice(start, page.indexOf('</div>', page.indexOf('CandidateDocDownloadButton', start)));
  assert.ok(block.includes('ct.previewDocBtn') && block.includes('CandidateDocDownloadButton'), 'preview and download stay in the same wrapping row');
});
