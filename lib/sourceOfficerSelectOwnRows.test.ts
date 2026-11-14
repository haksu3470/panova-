import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8').replace(/\r\n/g, '\n');
/** SQL without -- comments, so prose cannot satisfy a check. */
const code = (sql: string) => sql.replace(/--[^\n]*/g, '');
const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

const MIGRATION = 'supabase/migrations/20261117120000_source_officer_select_own_rows.sql';
const ROLLBACK = 'supabase/rollback/20261117120000_source_officer_select_own_rows_rollback.sql';
const VERIFICATION = 'supabase/verification/field_officer_registration.sql';

const migration = code(read(MIGRATION));
const rollback = code(read(ROLLBACK));

function fnBody(sql: string, signature: string): string {
  const start = sql.indexOf(`create or replace function public.${signature}`);
  assert.ok(start >= 0, `missing ${signature}`);
  const open = sql.indexOf('$$', start);
  return sql.slice(start, sql.indexOf('$$', open + 2) + 2);
}

/** The source_country branch of staff_can_read_candidate, as last defined in the repo. */
function sourceBranchOfReadScope(): string {
  const scope = code(read('supabase/migrations/20261110120000_staff_read_scope.sql'));
  const body = fnBody(scope, 'staff_can_read_candidate(p_id uuid)');
  const start = body.indexOf("where me.role_level = 'source_country'");
  const end = body.indexOf('or exists', start);
  return body.slice(start, end);
}

test('only the SELECT policy and one new function: no write policy, staff_can_read_candidate untouched', () => {
  const policies = [...migration.matchAll(/create policy (\w+) on ([\w.]+)\s+for (\w+)/g)];
  assert.deepEqual(policies.map((m) => [m[1], m[2], m[3]]), [['staff_select_candidates', 'public.job_candidates', 'select']]);
  assert.equal(/staff_can_read_candidate\(p_id/.test(migration), false, 'staff_can_read_candidate is not redefined');
  assert.equal(/staff_update_candidates|manager_delete_open_candidate|alter table|update public\.|delete from|insert into/i.test(migration), false);
  const functions = [...migration.matchAll(/create or replace function public\.(\w+)/g)].map((m) => m[1]);
  assert.deepEqual(functions, ['source_officer_sees_candidate_row']);
  // the older migration is not edited in this change
  assert.ok(read('supabase/migrations/20261117100000_field_officer_registration.sql').includes('field_officer_owns_candidate'));
});

test('the row function is the source_country branch of staff_can_read_candidate, on the row columns', () => {
  const fn = fnBody(migration, 'source_officer_sees_candidate_row(p_referral_code text, p_nationality text)');
  for (const part of ['language sql', 'stable', 'security definer', "set search_path to ''", 'from public.current_staff() me']) {
    assert.ok(fn.includes(part), part);
  }
  // same rule, with c.<column> replaced by the parameter
  const expected = squash(
    sourceBranchOfReadScope()
      .replace('c.referral_code', 'p_referral_code')
      .replace('public.country_key(c.nationality)', 'public.country_key(p_nationality)'),
  );
  assert.ok(squash(fn).includes(expected), `expected the branch:\n${expected}`);
  assert.match(migration, /revoke all on function public\.source_officer_sees_candidate_row\(text, text\) from public, anon;/);
  assert.match(migration, /grant execute on function public\.source_officer_sees_candidate_row\(text, text\) to authenticated;/);
});

test('SELECT policy keeps the earlier conditions and adds the row check', () => {
  const start = migration.indexOf('create policy staff_select_candidates');
  const policy = squash(migration.slice(start, migration.indexOf(';', start)));
  assert.ok(migration.indexOf('drop policy if exists staff_select_candidates on public.job_candidates;') < start);
  assert.ok(
    policy.includes(
      'using ( public.is_staff() and ( public.staff_can_read_candidate(id) or public.field_officer_owns_candidate(registered_by, referral_code) or public.source_officer_sees_candidate_row(referral_code, nationality) ) )',
    ),
    policy,
  );
});

test('one transaction, idempotent, schema reload at the end', () => {
  assert.match(migration, /^\s*begin;/m);
  assert.ok(migration.trimEnd().endsWith("notify pgrst, 'reload schema';\n\ncommit;"));
  assert.equal(/create function |create policy (?!staff_select_candidates)/.test(migration), false);
});

test('rollback returns the SELECT policy to its field-officer state and drops the function', () => {
  const start = rollback.indexOf('create policy staff_select_candidates');
  const policy = squash(rollback.slice(start, rollback.indexOf(';', start)));
  assert.ok(
    policy.includes('using ( public.is_staff() and ( public.staff_can_read_candidate(id) or public.field_officer_owns_candidate(registered_by, referral_code) ) )'),
    policy,
  );
  assert.equal(policy.includes('source_officer'), false);
  assert.ok(rollback.indexOf('drop function if exists public.source_officer_sees_candidate_row(text, text);') > start);
  assert.match(rollback, /^commit;/m);
});

test('verification: precheck, e2 with returning, e3 still hidden, d2 treats NULL as refused', () => {
  const body = code(read(VERIFICATION));
  assert.ok(body.includes('] 0b 20261117120000_source_officer_select_own_rows.sql uygulanmamış'), 'precheck says YAPILAMADI');
  assert.ok(body.includes('] e2 kaynak ülke: insert ... returning geçti'));
  assert.ok(body.includes('] e3 kaynak ülke başka kodlu, başka ülkeden adayı görmüyor'));
  // e2 is not skipped when the migration is missing: only the 0b line depends on it
  const e2 = body.slice(body.indexOf('-- e2.'), body.indexOf('] e2 kaynak ülke: insert'));
  assert.equal(e2.includes('v_src_rows'), false);
  assert.match(body, /v_bool := coalesce\(public\.can_access_candidate_file\(v_other::text \|\| '\/passport\/test\.pdf'\), false\)\s+or coalesce\(/);
  // the new function is called dynamically, so the test still parses without it
  assert.match(body, /execute 'select coalesce\(public\.source_officer_sees_candidate_row\(\$1, \$2\), false\)'/);
  assert.equal(/\bcommit\b/i.test(body), false);
  assert.match(body, /raise exception 'SONUC: /);
});
