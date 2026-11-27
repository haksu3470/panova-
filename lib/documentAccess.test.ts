import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

/**
 * Who can reach whose document (portal downloads and PDFs). Reads the
 * migrations in order and checks the LAST definition of each rule, so a
 * later migration that opens a file to employers or other candidates fails
 * here. Live-database checks are in the PR report.
 */
const dir = new URL('../supabase/migrations/', import.meta.url);
const sql = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(new URL(f, dir), 'utf8')).join('\n');

function last(pattern: RegExp): string {
  const all = [...sql.matchAll(pattern)];
  assert.ok(all.length, `missing: ${pattern}`);
  return all[all.length - 1][0];
}

test('storage: a file is read only by its own candidate or scoped staff, never an employer', () => {
  const select = last(/create policy candidate_files_select on storage\.objects[\s\S]*?\);\n/g);
  assert.match(select, /can_access_candidate_file\(name\)/);
  assert.match(select, /is_staff\(\) and public\.field_officer_owns_candidate_id/);
  assert.equal(/employer/i.test(select), false, select);
  const fn = last(/create or replace function public\.can_access_candidate_file[\s\S]*?\$\$;/g);
  assert.match(fn, /candidate_file_owner\(p_name\) = public\.my_candidate_id\(\)/);
  assert.match(fn, /is_staff\(\)\s+and public\.staff_can_read_candidate/);
  assert.equal(/employer/i.test(fn), false);
  assert.match(sql, /revoke all on function public\.can_access_candidate_file\(text\) from public, anon;/);
});

test('download address: log_document_access refuses anyone but the owner and scoped staff', () => {
  const fn = last(/create or replace function public\.log_document_access[\s\S]*?\$\$;/g);
  // coalesce(..., false): for a non-candidate my_candidate_id() is null, and plpgsql skips an IF whose test is null.
  assert.match(fn, /if not coalesce\(\s+v_candidate = public\.my_candidate_id\(\)\s+or \(public\.is_staff\(\) and public\.staff_can_read_candidate\(v_candidate\)\),\s+false\s+\) then/);
  assert.match(fn, /raise exception 'forbidden'/);
  assert.equal(/employer/i.test(fn), false);
});

test('document rows: candidates write only their own; staff policies are scoped', () => {
  assert.match(last(/create policy cand_docs_insert[\s\S]*?;\n/g), /candidate_id = public\.my_candidate_id\(\)/);
  assert.match(last(/create policy cand_docs_update[\s\S]*?;\n/g), /using \(candidate_id = public\.my_candidate_id\(\)/);
  for (const policy of sql.match(/create policy \w+ on public\.candidate_documents[\s\S]*?;\n/g) || []) {
    assert.equal(/employer/i.test(policy), false, policy);
  }
});

test('employer candidate list: own presented matches only, no passport, phone, e-mail or files', () => {
  const fn = last(/create (or replace )?function public\.employer_browse_candidates\(\)[\s\S]*?\$\$;/g);
  assert.match(fn, /r\.employer_id = public\.my_employer_id\(\)/);
  assert.match(fn, /m\.presented_at is not null/);
  const columns = fn.slice(0, fn.indexOf(')\n'));
  for (const secret of ['passport', 'phone', 'email', 'file_url', 'documents', 'birth', 'address']) {
    assert.equal(columns.includes(secret), false, secret);
  }
  assert.match(sql, /revoke all on function public\.employer_browse_candidates\(\) from public, anon;/);
});
