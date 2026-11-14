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

/** Text of `create policy <name> on <table>` up to the next `;`. */
function policy(sql: string, name: string): string {
  const start = sql.indexOf(`create policy ${name} `);
  assert.ok(start >= 0, `missing policy ${name}`);
  return sql.slice(start, sql.indexOf(';', start));
}

const migration = code(read(MIGRATION));
const rollback = code(read(ROLLBACK));

test('idempotent: columns, policies, triggers and the role check can run twice', () => {
  assert.match(migration, /add column if not exists registered_by uuid references public\.staff_members \(id\)/);
  assert.match(migration, /add column if not exists kvkk_recorded_by uuid references public\.staff_members \(id\)/);
  assert.match(migration, /create index if not exists job_candidates_registered_by_idx/);
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
  assert.match(migration, /^\s*begin;/m);
  assert.match(migration, /^commit;/m);
});

test('existing rows: only the one-time field officer code backfill writes data', () => {
  assert.equal(/update public\.job_candidates|delete from|truncate/i.test(migration), false, 'candidate rows are not touched');
  const updates = [...migration.matchAll(/update public\.(\w+)[\s\S]*?;/g)].map((m) => m[0]);
  assert.equal(updates.length, 1);
  assert.match(updates[0], /update public\.staff_members\s+set updated_at = now\(\)\s+where role_level = 'field_officer'\s+and referral_code is null;/);
  assert.match(migration, /saha görevlisi kodsuz kaldı/);
});

test('1. codes: field_officer gets one, a client code is never taken, an issued code comes back', () => {
  const assign = fn(migration, 'assign_supervisor_referral_code');
  assert.match(assign, /new\.role_level in \('source_country', 'field_officer'\)/);
  // the only sources of a code: the ledger, the old row, the generator
  const sources = [...assign.matchAll(/new\.referral_code := ([^;]+);/g)].map((m) => m[1]);
  assert.deepEqual(sources.sort(), ['null', 'old.referral_code', 'public.generate_supervisor_referral_code()', 'v_existing'].sort());
  assert.match(assign, /from private\.staff_referral_codes ledger/);
  assert.match(fn(migration, 'record_supervisor_referral_code'), /new\.role_level in \('source_country', 'field_officer'\)/);
  assert.match(migration, /role_level in \('source_country', 'field_officer'\)\s+and referral_code ~ '\^PV\[ABCDEFGHJKLMNPQRSTUVWXYZ23456789\]\{6\}\$'/);
});

test('2-3. insert: registered_by, the officer code and KVKK are written by the server', () => {
  const stamp = fn(migration, 'stamp_candidate_referral_code');
  const update = stamp.slice(stamp.indexOf("if tg_op = 'UPDATE' then"), stamp.indexOf('return new;') + 'return new;'.length);
  for (const col of ['referral_code', 'registered_by', 'kvkk_recorded_by']) {
    assert.ok(update.includes(`new.${col} := old.${col};`), `${col} is immutable`);
  }
  assert.match(stamp, /from public\.current_staff\(\) me/);
  assert.match(stamp, /new\.registered_by := v_staff_id;\s+new\.kvkk_recorded_by := null;/);
  assert.match(stamp, /if new\.kvkk_accepted_at is not null then\s+new\.kvkk_recorded_by := v_staff_id;\s+new\.kvkk_version := v_kvkk_version;/);
  assert.match(stamp, /if v_role in \('source_country', 'field_officer'\) then\s+if v_code is not null[^\n]*\n\s+new\.referral_code := v_code;/);
  // upper management still chooses a code, now from source-country and field officer codes
  const manager = stamp.slice(stamp.indexOf("if v_role = 'upper_management'"));
  assert.match(manager, /s\.role_level in \('source_country', 'field_officer'\)/);
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

test('4. field officers see their own candidates; no write right is added', () => {
  // staff_can_read_candidate feeds many write policies: it is not redefined
  assert.equal(migration.includes('function public.staff_can_read_candidate('), false);
  const owns = fn(migration, 'field_officer_owns_candidate');
  assert.match(owns, /me\.role_level = 'field_officer'/);
  assert.match(owns, /p_registered_by is not null and p_registered_by = me\.staff_id/);
  assert.match(owns, /me\.referral_code is not null and p_referral_code = me\.referral_code/);
  assert.match(fn(migration, 'field_officer_owns_candidate_id'), /public\.field_officer_owns_candidate\(c\.registered_by, c\.referral_code\)/);
  assert.match(
    policy(migration, 'staff_select_candidates'),
    /for select to authenticated\s+using \(\s+public\.is_staff\(\)\s+and \(\s+public\.staff_can_read_candidate\(id\)\s+or public\.field_officer_owns_candidate\(registered_by, referral_code\)\s+\)\s+\)/,
  );
  // every policy the migration writes is SELECT or INSERT
  for (const m of migration.matchAll(/create policy \w+ on [\w.]+\s+for (\w+)/g)) {
    assert.ok(['select', 'insert'].includes(m[1]), `no ${m[1]} policy`);
  }
  for (const name of ['staff_update_candidates', 'manager_delete_open_candidate', 'staff_update_documents', 'candidate_files_update', 'candidate_files_delete']) {
    assert.equal(migration.includes(name + ' on'), false, `${name} is not touched`);
  }
  // inserting opens no status or assignee write
  const stamp = fn(migration, 'stamp_candidate_referral_code');
  const field = stamp.slice(stamp.indexOf("if v_role = 'field_officer' then"), stamp.indexOf("if v_role in ('source_country', 'field_officer')"));
  for (const line of [
    "new.status := 'pending';",
    'new.official_process_status := null;',
    "new.travel_status := 'planned';",
    'new.flight_date := null;',
    'new.active_request_id := null;',
    'new.assigned_to := null;',
    'new.assigned_backup := null;',
  ]) {
    assert.ok(field.includes(line), line);
  }
  assert.match(fn(migration, 'staff_can_insert_candidate'), /me\.role_level in \('source_country', 'field_officer'\)/);
});

test('5. documents and files: INSERT / SELECT for own candidates, other roles keep their rule', () => {
  for (const name of ['staff_select_documents', 'staff_insert_documents']) {
    assert.match(policy(migration, name), /public\.is_staff\(\)\s+and \(\s+public\.staff_can_read_candidate\(candidate_id\)\s+or public\.field_officer_owns_candidate_id\(candidate_id\)\s+\)/);
  }
  for (const name of ['candidate_files_select', 'candidate_files_insert']) {
    assert.match(
      policy(migration, name),
      /bucket_id = 'candidate-files'\s+and \(\s+public\.can_access_candidate_file\(name\)\s+or \(public\.is_staff\(\) and public\.field_officer_owns_candidate_id\(public\.candidate_file_owner\(name\)\)\)\s+\)/,
    );
  }
});

test('rollback restores the earlier policies and functions and keeps the recorded data', () => {
  assert.match(fn(rollback, 'assign_supervisor_referral_code'), /if new\.role_level = 'source_country' then/);
  assert.match(fn(rollback, 'staff_can_insert_candidate'), /where me\.role_level = 'source_country'/);
  assert.equal(fn(rollback, 'stamp_candidate_referral_code').includes('registered_by'), false);
  assert.equal(rollback.includes('function public.staff_can_read_candidate('), false);
  assert.match(policy(rollback, 'staff_select_candidates'), /using \(public\.is_staff\(\) and public\.staff_can_read_candidate\(id\)\)/);
  assert.match(policy(rollback, 'staff_insert_documents'), /with check \(public\.is_staff\(\) and public\.staff_can_read_candidate\(candidate_id\)\)/);
  assert.match(policy(rollback, 'candidate_files_insert'), /with check \(bucket_id = 'candidate-files' and public\.can_access_candidate_file\(name\)\)/);
  const drops = rollback.indexOf('drop function if exists public.field_officer_owns_candidate(uuid, text);');
  assert.ok(drops > rollback.lastIndexOf('create policy'), 'helpers are dropped after the policies that used them');
  assert.ok(rollback.includes('drop function if exists public.field_officer_owns_candidate_id(uuid);'));
  assert.equal(/drop column/.test(rollback), false, 'column drops stay commented out');
  assert.match(read(ROLLBACK), /-- alter table public\.job_candidates drop column if exists registered_by;/);
  assert.match(rollback, /^commit;/m);
});

test('verification covers a-f, keeps nothing and uses no real addresses', () => {
  const sql = read(VERIFICATION);
  const body = code(sql);
  assert.equal(/\bcommit\b/i.test(body), false);
  assert.match(body, /raise exception 'SONUC: GEÇTİ=% KALDI=% YAPILAMADI=%/);
  assert.ok(body.trimEnd().endsWith('end\n$$;'));
  const emails = sql.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) ?? [];
  assert.ok(emails.length > 0);
  for (const email of emails) assert.match(email, /@example\.invalid$/, email);
  assert.equal(/where[^;]*(sm\.email|sm\.name|p\.full_name)\s*=/.test(body), false, 'accounts are picked by role');
  for (const step of ['0', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'c3', 'd1', 'd2', 'd3', 'e1', 'e2', 'f1', 'f2']) {
    assert.ok(body.includes(`] ${step} `), `step ${step}`);
  }
});

test('portal: field officers register under their own code; warnings stay source-country only', () => {
  const tab = read('components/portal/CandidatesTab.tsx');
  assert.match(tab, /const isCodeIssuer = isCodeIssuingRole\(currentUser\?\.role_level\);/);
  assert.match(tab, /const ownCode = isCodeIssuer \? normalizeReferralCode\(currentUser\?\.referral_code\) : null;/);
  assert.match(tab, /const registerHint = isCodeIssuer\n/);
  assert.match(tab, /if \(!isCodeIssuer && isUpperManagement && draft\.referralCode\)/);
  assert.equal(tab.includes('isSourceOfficer'), false);
  const staff = read('components/portal/StaffTab.tsx');
  assert.match(staff, /isCodeIssuingRole\(staff\.role_level\) && normalizeReferralCode\(staff\.referral_code\) \?/);
  // "missing code" warning stays for source_country until the migration is applied everywhere
  assert.match(staff, /isSourceCountryOfficer\(staff\.role_level\) && !normalizeReferralCode\(staff\.referral_code\) \?/);
  assert.match(read('app/portal/page.tsx'), /isCodeIssuingRole\(currentUser\?\.role_level\) && normalizeReferralCode\(currentUser\?\.referral_code\)/);
});
