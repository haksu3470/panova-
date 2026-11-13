import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { translations } from './dictionary.ts';
import {
  DEMO_DELETABLE_TABLES,
  DEMO_SUMMARY_ROWS,
  DEMO_UNTOUCHED_TABLES,
  demoCounts,
  demoDeletableTotal,
  demoErrorText,
  demoSeedOutcome,
  demoTotal,
  isDemoRoleError,
  listFolderFiles,
  removeCandidateFolders,
  type DemoFileBucket,
} from './demoData.ts';

const ROOT = join(import.meta.dirname, '..');
const LANGS = ['tr', 'en', 'sq', 'ar', 'mk'] as const;

test('RPC result is read as whole counts per table', () => {
  assert.deepEqual(demoCounts({ employers: 2, job_requests: '3', bad: 'x', neg: -1, frac: 2.7 }), {
    employers: 2, job_requests: 3, frac: 2,
  });
  assert.deepEqual(demoCounts(null), {});
  assert.deepEqual(demoCounts([1, 2]), {});
  assert.deepEqual(demoCounts('{"a":1}'), {});
});

test('seed summary: created total, or "already exists" when all zero', () => {
  assert.deepEqual(
    demoSeedOutcome({ employers: 2, job_requests: 3, job_candidates: 5, request_matches: 5, interviews: 2, job_offers: 3, candidate_documents: 6 }),
    { kind: 'created', total: 26 },
  );
  assert.deepEqual(demoSeedOutcome({ employers: 0, job_requests: 0 }), { kind: 'already_exists' });
  assert.deepEqual(demoSeedOutcome(null), { kind: 'already_exists' });
});

test('summary cards and delete total leave out the untouched tables', () => {
  const shown = DEMO_SUMMARY_ROWS.map((row) => row.table) as string[];
  assert.deepEqual(shown, [
    'employers', 'job_requests', 'job_candidates', 'request_matches', 'interviews', 'job_offers',
    'candidate_documents', 'tasks', 'candidate_support_tickets',
  ]);
  for (const table of DEMO_UNTOUCHED_TABLES) {
    assert.equal(shown.includes(table), false, table);
    assert.equal((DEMO_DELETABLE_TABLES as readonly string[]).includes(table), false, table);
  }
  const counts = demoCounts({ employers: 2, job_candidates: 5, audit_logs: 40, staff_members: 3, portal_users: 1, applicants: 7, candidate_notifications: 4 });
  assert.equal(demoDeletableTotal(counts), 11);
  assert.equal(demoTotal(counts, ['employers', 'missing']), 2);
});

test('permission error is recognised', () => {
  assert.ok(isDemoRoleError({ code: '42501', message: 'staff_role_not_allowed' }));
  assert.ok(isDemoRoleError({ message: 'staff_role_not_allowed' }));
  assert.ok(isDemoRoleError({ code: '42501', message: 'permission denied for function staff_seed_demo_data' }));
  assert.ok(isDemoRoleError('staff_role_not_allowed'));
  assert.equal(isDemoRoleError({ code: '23505', message: 'duplicate key' }), false);
  assert.equal(isDemoRoleError(null), false);
  assert.equal(demoErrorText({ message: ' boom ' }), 'boom');
  assert.equal(demoErrorText({ error: 'Not found' }), 'Not found');
  assert.equal(demoErrorText(undefined), 'unknown error');
});

function fakeBucket(tree: Record<string, string[]>, failRemoveAt?: number) {
  const removed: string[][] = [];
  const bucket: DemoFileBucket = {
    async list(path) {
      const names = tree[path] ?? [];
      return { data: names.map((n) => (n.endsWith('/') ? { name: n.slice(0, -1), id: null } : { name: n, id: 'x' })), error: null };
    },
    async remove(paths) {
      removed.push(paths);
      if (failRemoveAt !== undefined && removed.length === failRemoveAt) return { data: null, error: { message: 'storage down' } };
      return { data: [], error: null };
    },
  };
  return { bucket, removed };
}

test('candidate files are listed recursively and removed per candidate', async () => {
  const { bucket, removed } = fakeBucket({
    c1: ['passport/', 'cv/'],
    'c1/passport': ['a.pdf', 'b.jpg'],
    'c1/cv': ['c.pdf'],
    c2: [],
  });
  assert.deepEqual(await listFolderFiles(bucket, 'c1'), ['c1/passport/a.pdf', 'c1/passport/b.jpg', 'c1/cv/c.pdf']);
  assert.equal(await removeCandidateFolders(bucket, ['c1', 'c2']), 3);
  assert.deepEqual(removed, [['c1/passport/a.pdf', 'c1/passport/b.jpg', 'c1/cv/c.pdf']]);
});

test('a storage error stops the file step (and is thrown)', async () => {
  const { bucket, removed } = fakeBucket({ c1: ['a.pdf'], c2: ['b.pdf'] }, 1);
  await assert.rejects(removeCandidateFolders(bucket, ['c1', 'c2']), { message: 'storage down' });
  assert.equal(removed.length, 1, 'second candidate not touched');
  const listFails: DemoFileBucket = {
    list: async () => ({ data: null, error: { message: 'list denied' } }),
    remove: async () => ({ data: [], error: null }),
  };
  await assert.rejects(removeCandidateFolders(listFails, ['c1']), { message: 'list denied' });
});

test('card: upper management only, files before the RPC, buttons locked while running', () => {
  const page = readFileSync(join(ROOT, 'app/portal/page.tsx'), 'utf8');
  assert.ok(page.includes('{isUpperManagement && <DemoDataCard t={t} onChanged={fetchAllData} />}'));
  const card = readFileSync(join(ROOT, 'components/portal/DemoDataCard.tsx'), 'utf8');
  const files = card.indexOf('removeCandidateFolders(');
  const rpc = card.indexOf("rpc('staff_delete_demo_data')");
  assert.ok(files > 0 && rpc > files, 'storage first, then the RPC');
  assert.match(card.slice(files, rpc), /catch \(fileError\) \{[\s\S]*?return \{ tone: 'error'/, 'a file error returns before the RPC');
  assert.ok(card.includes(".eq('is_demo', true)") && card.includes(".is('auth_user_id', null)"));
  assert.ok(card.includes('if (running.current) return;'));
  assert.ok(card.includes('disabled={disabled}'));
  assert.ok(card.includes('bg-red-600'));
  assert.equal((card.match(/window\.confirm\(/g) || []).length, 2);
  assert.ok(card.includes("role={notice.tone === 'error' ? 'alert' : 'status'}"));
});

test('new texts in five languages, translated', () => {
  const keys = [
    'demoDataTitle', 'demoDataDesc', 'demoDataLoading', ...DEMO_SUMMARY_ROWS.map((r) => r.label),
    'demoDataSeed', 'demoDataSeedConfirm', 'demoDataSeedDone', 'demoDataAlreadyExists', 'demoDataDelete',
    'demoDataDeleteConfirm', 'demoDataDeleteDone', 'demoDataNothing', 'demoDataFilesFailed',
    'demoDataRoleError', 'demoDataFailed', 'demoDataWorking',
  ] as const;
  for (const lang of LANGS) {
    for (const key of keys) {
      const v = translations[lang][key];
      assert.ok(v?.trim(), `${lang}.${key}`);
      if (lang !== 'en') assert.notEqual(v, translations.en[key], `${lang}.${key}`);
    }
    for (const key of ['demoDataSeedDone', 'demoDataDeleteDone', 'demoDataDeleteConfirm'] as const) {
      assert.ok(translations[lang][key]!.includes('{n}'), `${lang}.${key}`);
    }
    for (const key of ['demoDataFilesFailed', 'demoDataFailed'] as const) {
      assert.ok(translations[lang][key]!.includes('{error}'), `${lang}.${key}`);
    }
    assert.equal(translations[lang].demoDataDeleteConfirm!.split('\n').length >= 4, true, `${lang}: backup + linked accounts lines`);
  }
});
