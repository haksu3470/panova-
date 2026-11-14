import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import { EXPORT_COLUMNS, EXPORT_COLUMN_LABELS, EXPORT_HIDDEN_COLUMNS, labelExportColumns, renameColumns } from './exportColumns.ts';
import { printHtmlInNewWindow } from './printWindow.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);
const { candidateExportRows, employerExportRows, offerExportRows, requestExportRows, toCsv, toPrintHtml } = await import('./exportLists.ts');
const { portalUi } = await import('./portal-ui-copy.ts');

const ROOT = join(import.meta.dirname, '..');
const LANGS = ['tr', 'en', 'sq', 'ar', 'mk'] as const;

test('column headings exist in five languages and are translated', () => {
  for (const lang of LANGS) {
    assert.deepEqual(Object.keys(EXPORT_COLUMN_LABELS[lang]).sort(), [...EXPORT_COLUMNS].sort(), lang);
    for (const [key, label] of Object.entries(EXPORT_COLUMN_LABELS[lang])) assert.ok(label.trim(), `${lang}.${key}`);
  }
  for (const lang of ['en', 'sq', 'ar', 'mk'] as const) {
    for (const [key, label] of Object.entries(EXPORT_COLUMN_LABELS[lang])) {
      assert.equal(/[ğışİĞŞ]/.test(label), false, `${lang}.${key}: ${label}`);
    }
  }
  for (const label of Object.values(EXPORT_COLUMN_LABELS.ar)) assert.match(label, /[؀-ۿ]/);
  for (const label of Object.values(EXPORT_COLUMN_LABELS.mk)) assert.match(label, /[Ѐ-ӿ]/);
});

test('labelExportColumns renames known keys, keeps unknown keys and values', () => {
  const rows = [{ position_title: 'Aşçı', headcount: 2, extra: 'x' }];
  assert.deepEqual(labelExportColumns(rows, 'en'), [{ Position: 'Aşçı', Headcount: 2, extra: 'x' }]);
  assert.deepEqual(renameColumns(rows, { extra: 'Ek' }), [{ position_title: 'Aşçı', headcount: 2, Ek: 'x' }]);
  assert.deepEqual(rows, [{ position_title: 'Aşçı', headcount: 2, extra: 'x' }], 'input not changed');
});

test('print window opens without noopener, cuts the opener, writes and prints', () => {
  const calls: string[] = [];
  let features: string | undefined;
  const popup = {
    opener: {} as unknown,
    document: {
      open: () => calls.push('open'),
      write: (html: string) => calls.push(`write:${html.length}`),
      close: () => calls.push('close'),
    },
    focus: () => calls.push('focus'),
    print: () => calls.push('print'),
    close: () => calls.push('closed'),
    addEventListener: (type: string, listener: () => void, options?: { once?: boolean }) => {
      calls.push(`listen:${type}:${options?.once === true}`);
      afterprint = listener;
    },
  };
  let afterprint: (() => void) | undefined;
  const ok = printHtmlInNewWindow('<p>x</p>', (url, target, ...rest: unknown[]) => {
    features = rest[0] as string | undefined;
    assert.equal(url, '');
    assert.equal(target, '_blank');
    return popup as unknown as Window;
  });
  assert.equal(ok, true);
  assert.equal(features, undefined, 'no window features (noopener would make open() return null)');
  assert.equal(popup.opener, null);
  assert.deepEqual(calls, ['open', 'write:8', 'close', 'listen:afterprint:true', 'focus', 'print']);
  afterprint?.();
  assert.equal(calls.at(-1), 'closed', 'the window closes after printing or cancelling');
  assert.equal(printHtmlInNewWindow('<p>x</p>', () => null), false, 'blocked window reports false');
});

test('ListExportBar: audit is optional (staff default on), print uses the shared window, no noopener', () => {
  const bar = readFileSync(join(ROOT, 'components/portal/ListExportBar.tsx'), 'utf8');
  assert.match(bar, /audit = true/);
  assert.match(bar, /if \(!audit\) return;/);
  assert.ok(bar.includes('printHtmlInNewWindow(toPrintHtml(dated(), rows, dir, options))'));
  assert.ok(bar.includes('EXPORT_COLUMN_LABELS[lang]'), 'headings always come from the shared column labels');
  assert.equal(bar.includes('columnLabels'), false);
  assert.equal(bar.includes('noopener'), false);
  const helper = readFileSync(join(ROOT, 'lib/printWindow.ts'), 'utf8');
  assert.equal(/open\([^)]*noopener/.test(helper), false);
  // staff call sites keep the default (audit on) and show the blocked-window message
  for (const file of ['app/portal/page.tsx', 'components/portal/CandidatesTab.tsx', 'components/portal/RequestsTab.tsx']) {
    const source = readFileSync(join(ROOT, file), 'utf8');
    assert.equal(source.includes('audit={false}'), false, file);
    assert.ok(source.includes('popupBlocked: ui.exportPopupBlocked'), file);
    assert.match(source, /lang=\{(currentLang|lang)\}/, file);
  }
  assert.match(readFileSync(join(ROOT, 'app/employer/page.tsx'), 'utf8'), /lang=\{currentLang\}/);
});

test('print HTML carries the text direction; blocked-window text in five languages', () => {
  assert.match(toPrintHtml('T', [{ a: 1 }], 'rtl'), /<html dir="rtl">/);
  assert.match(toPrintHtml('T', [{ a: 1 }]), /<html dir="ltr">/);
  for (const lang of LANGS) assert.ok(portalUi[lang].exportPopupBlocked.trim(), lang);
});

test('internal columns are dropped from every export (list pinned)', () => {
  assert.deepEqual([...EXPORT_HIDDEN_COLUMNS], [
    'id', 'is_demo', 'candidate_id', 'match_id', 'request_id', 'employer_id', 'job_request_id',
    'auth_user_id', 'user_id', 'created_by', 'assigned_to', 'assigned_backup',
    'referral_code', 'internal_notes', 'panova_notes',
  ]);
  for (const key of EXPORT_HIDDEN_COLUMNS) assert.equal((EXPORT_COLUMNS as readonly string[]).includes(key), false, key);
  const row = Object.fromEntries([...EXPORT_HIDDEN_COLUMNS.map((key) => [key, `SECRET-${key}`]), ['full_name', 'Demo']]);
  assert.deepEqual(renameColumns([row], {}), [{ full_name: 'Demo' }]);
  assert.equal(/SECRET/.test(toCsv([row])), false);
});

test('staff export headings come from the shared labels in five languages', () => {
  const lists = {
    requests: requestExportRows([{ id: 'r', is_demo: true, status: 'interviews' }], 'tr'),
    employers: employerExportRows([{ id: 'e', is_demo: true }], 'tr'),
    offers: offerExportRows([{ id: 'o', candidate_id: 'c', is_demo: true }], 'tr'),
    candidates: candidateExportRows([{ id: 'c', is_demo: true }], 'tr', {
      candidateStatus: 'status', officialProcess: 'official_process_status', statusLabels: {}, steps: {}, stopped: 'x',
    }),
  };
  for (const [list, rows] of Object.entries(lists)) {
    const keys = Object.keys(rows[0]);
    for (const key of keys) assert.ok((EXPORT_COLUMNS as readonly string[]).includes(key), `${list}.${key} has no heading`);
    for (const lang of LANGS) {
      const header = toCsv(rows, { labels: EXPORT_COLUMN_LABELS[lang] }).split('\r\n')[0].split(';');
      assert.deepEqual(header, keys.map((key) => EXPORT_COLUMN_LABELS[lang][key as keyof (typeof EXPORT_COLUMN_LABELS)['tr']]), `${list} ${lang}`);
      for (const technical of ['id', 'is_demo', 'employer_name', 'position_title', 'monthly_net_salary', 'company_name', 'contact_person']) {
        assert.equal(header.includes(technical), false, `${list} ${lang} shows ${technical}`);
      }
    }
  }
});
