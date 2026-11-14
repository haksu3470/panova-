import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8').replace(/\r\n/g, '\n');

const MIGRATION = 'supabase/migrations/20261117100000_field_officer_registration.sql';
const ROLLBACK = 'supabase/rollback/20261117100000_field_officer_registration_rollback.sql';
const VERIFICATION = 'supabase/verification/field_officer_registration.sql';

/** SQL without -- comments, so prose cannot satisfy a check. */
const code = (sql: string) => sql.replace(/--[^\n]*/g, '');

/** Body of `create or replace function public.<name>(` up to its closing $$. */
function fn(sql: string, name: string): string {
  const start = sql.indexOf(`create or replace function public.${name}(`);
  assert.ok(start >= 0, `missing function ${name}`);
  const open = sql.indexOf('$$', start);
  const close = sql.indexOf('$$', open + 2);
  return sql.slice(start, close);
}

const migration = code(read(MIGRATION));
const rollback = code(read(ROLLBACK));

test('idempotent: columns, policies, triggers and the role check can run twice', () => {
  assert.match(migration, /add column if not exists registered_by uuid references public\.staff_members \(id\)/);
  assert.match(migration, /add column if not exists kvkk_recorded_by uuid references public\.staff_members \(id\)/);
  for (const m of migration.matchAll(/create policy (\w+) on ([\w.]+)/g)) {
    assert.ok(migration.includes(`drop policy if exists ${m[1]} on ${m[2]};`), `${m[1]} needs drop policy if exists`);
  }
  for (const m of migration.matchAll(/create trigger (\w+)/g)) {
    assert.ok(migration.includes(`drop trigger if exists ${m[1]} `), `${m[1]} needs drop trigger if exists`);
  }
  assert.ok(
    migration.indexOf('drop constraint if exists staff_members_referral_code_role') <
      migration.indexOf('add constraint staff_members_referral_code_role'),
  );
  assert.equal(/create function |create table /.test(migration), false, 'functions use create or replace');
  assert.match(migration, /create index if not exists job_candidates_registered_by_idx/);
  assert.match(migration, /^\s*begin;/m);
  assert.match(migration, /^commit;/m);
});

test('existing rows: only the one-time field officer code backfill writes data', () => {
  assert.equal(/update public\.job_candidates|delete from|truncate/i.test(migration), false, 'candidate rows are not touched');
  const updates = [...migration.matchAll(/update public\.(\w+)[\s\S]*?;/g)].map((m) => m[0]);
  assert.equal(updates.length, 1);
  assert.match(updates[0], /update public\.staff_members\s+set updated_at = now\(\)\s+where role_level = 'field_officer'\s+and referral_code is null;/);
});

test('1. codes: field_officer gets one, a client code is never taken, an issued code comes back', () => {
  const assign = fn(migration, 'assign_supervisor_referral_code');
  assert.match(assign, /new\.role_level in \('source_country', 'field_officer'\)/);
  // the only sources of a code: the ledger, the old row, the generator
  const sources = [...assign.matchAll(/new\.referral_code := ([^;]+);/g)].map((m) => m[1]);
  assert.deepEqual(sources.sort(), ['null', 'old.referral_code', 'public.generate_supervisor_referral_code()', 'v_existing'].sort());
  assert.match(assign, /from private\.staff_referral_codes ledger/);
  assert.match(fn(migration, 'record_supervisor_referral_code'), /new\.role_level in \('source_country', 'field_officer'\)/);
  // PV + 6 format and the role check include field_officer
  assert.match(migration, /role_level in \('source_country', 'field_officer'\)\s+and referral_code ~ '\^PV\[ABCDEFGHJKLMNPQRSTUVWXYZ23456789\]\{6\}\$'/);
  // the backfill is checked inside the transaction
  assert.match(migration, /saha görevlisi kodsuz kaldı/);
});

test('2-3. insert: registered_by, the officer code and KVKK are written by the server', () => {
  const stamp = fn(migration, 'stamp_candidate_referral_code');
  // UPDATE cannot change any of the three
  const update = stamp.slice(stamp.indexOf("if tg_op = 'UPDATE' then"), stamp.indexOf('return new;') + 'return new;'.length);
  for (const col of ['referral_code', 'registered_by', 'kvkk_recorded_by']) {
    assert.ok(update.includes(`new.${col} := old.${col};`), `${col} is immutable`);
  }
  // staff id from current_staff(); the client value is overwritten
  assert.match(stamp, /from public\.current_staff\(\) me/);
  assert.match(stamp, /new\.registered_by := v_staff_id;\s+new\.kvkk_recorded_by := null;/);
  assert.match(stamp, /if new\.kvkk_accepted_at is not null then\s+new\.kvkk_recorded_by := v_staff_id;\s+new\.kvkk_version := v_kvkk_version;/);
  // field_officer and source_country stamp their own code
  assert.match(stamp, /if v_role in \('source_country', 'field_officer'\) then\s+if v_code is not null[^\n]*\n\s+new\.referral_code := v_code;/);
  // upper management still chooses among source-country codes only (unchanged)
  const manager = stamp.slice(stamp.indexOf("if v_role = 'upper_management'"));
  assert.match(manager, /s\.role_level = 'source_country'/);
  assert.match(manager, /unknown_supervisor_code/);
  // anon clears both staff columns
  assert.match(stamp, /new\.registered_by := null;\s+new\.kvkk_recorded_by := null;/);
});

test('3. the KVKK version in SQL is the one the site shows (lib/kvkk.ts)', () => {
  const version = /KVKK_VERSION = '([^']+)'/.exec(read('lib/kvkk.ts'))?.[1];
  assert.ok(version);
  assert.ok(fn(migration, 'stamp_candidate_referral_code').includes(`v_kvkk_version constant text := '${version}';`));
  assert.ok(read(VERIFICATION).includes(`v_kvkk constant text := '${version}';`));
});

test('4. read scope: field officers add registered_by and their code, the old rules stay', () => {
  const read_ = fn(migration, 'staff_can_read_candidate');
  const field = read_.slice(read_.indexOf("me.role_level = 'field_officer'"));
  for (const rule of [
    'c.assigned_to = me.staff_id',
    'c.assigned_backup = me.staff_id',
    'c.registered_by = me.staff_id',
    '(me.referral_code is not null and c.referral_code = me.referral_code)',
    'from public.tasks t',
  ]) {
    assert.ok(field.includes(rule), `field officer rule: ${rule}`);
  }
  // source_country and target_country branches are unchanged
  const before = code(read('supabase/migrations/20261110120000_staff_read_scope.sql'));
  const old = fn(before, 'staff_can_read_candidate');
  const head = (s: string) => s.slice(0, s.indexOf("me.role_level = 'field_officer'"));
  assert.equal(head(read_), head(old));

  const owns = fn(migration, 'field_officer_owns_candidate');
  assert.match(owns, /me\.role_level = 'field_officer'/);
  assert.match(owns, /p_registered_by is not null and p_registered_by = me\.staff_id/);
  assert.match(owns, /me\.referral_code is not null and p_referral_code = me\.referral_code/);
  for (const policy of ['staff_select_candidates', 'staff_update_candidates']) {
    const body = migration.slice(migration.indexOf(`create policy ${policy}`), migration.indexOf(';', migration.indexOf(`create policy ${policy}`)));
    assert.match(body, /public\.staff_can_read_candidate\(id\)\s+or public\.field_officer_owns_candidate\(registered_by, referral_code\)/);
  }
});

test('5. field officers may insert candidates and upload documents for readable candidates', () => {
  assert.match(fn(migration, 'staff_can_insert_candidate'), /me\.role_level in \('source_country', 'field_officer'\)/);
  assert.match(migration, /create policy staff_insert_documents on public\.candidate_documents\s+for insert to authenticated\s+with check \(public\.is_staff\(\) and public\.staff_can_read_candidate\(candidate_id\)\)/);
  assert.match(migration, /create policy candidate_files_insert on storage\.objects\s+for insert to authenticated\s+with check \(bucket_id = 'candidate-files' and public\.can_access_candidate_file\(name\)\)/);
  // delete rules are not widened
  assert.equal(/candidate_files_delete|manager_delete_open_candidate/.test(migration), false);
});

test('rollback restores the source-only versions and keeps the recorded data', () => {
  assert.match(fn(rollback, 'assign_supervisor_referral_code'), /if new\.role_level = 'source_country' then/);
  assert.equal(fn(rollback, 'staff_can_read_candidate').includes('registered_by'), false);
  assert.match(fn(rollback, 'staff_can_insert_candidate'), /where me\.role_level = 'source_country'/);
  assert.equal(fn(rollback, 'stamp_candidate_referral_code').includes('registered_by'), false);
  assert.match(rollback, /drop function if exists public\.field_officer_owns_candidate\(uuid, text\);/);
  assert.equal(/drop column/.test(rollback), false, 'column drops stay commented out');
  assert.match(read(ROLLBACK), /-- alter table public\.job_candidates drop column if exists registered_by;/);
  assert.match(rollback, /^commit;/m);
});

test('verification keeps nothing and uses no real addresses', () => {
  const sql = read(VERIFICATION);
  const body = code(sql);
  assert.equal(/\bcommit\b/i.test(body), false);
  assert.match(body, /raise exception 'SONUC: GEÇTİ=% KALDI=% YAPILAMADI=%/);
  assert.ok(body.trimEnd().endsWith('end\n$$;'));
  const emails = sql.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) ?? [];
  assert.ok(emails.length > 0);
  for (const email of emails) assert.match(email, /@example\.invalid$/, email);
  // accounts are picked by role, never by name or e-mail
  assert.equal(/where[^;]*(sm\.email|sm\.name|p\.full_name)\s*=/.test(body), false);
  for (const step of ['4 ', '7 ', '8 ', '10 ', '11 ', '12 ']) assert.ok(body.includes(`] ${step}`), `step ${step}`);
});
