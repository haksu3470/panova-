-- Profession catalog keys: map the legacy free-text profession and position values
-- found in the live data to catalog keys (lib/professions.ts).
--
-- Only exact, explicit matches (case-insensitive, trimmed) are changed:
--   job_candidates.profession   Cook -> cook, Electrician / elektrikçi -> electrician,
--                               Farm worker -> farm_worker, Machine operator -> machine_operator,
--                               Truck driver -> truck_driver
--   job_requests.position_title Cook -> cook, Electrician / Elektrikçi -> electrician
-- Every changed value is first saved in public.profession_key_backup (old and new
-- value per row), so the rollback can restore it. Rows already holding a key and any
-- other value are not touched. Idempotent: a second run changes nothing.
-- No schema change besides the backup table. One transaction.
-- Rollback: supabase/rollback/20261115130000_profession_catalog_keys_rollback.sql
-- Checks:   supabase/verification/profession_catalog_keys.sql

begin;

-- 0. Preconditions
do $$
declare
  v_missing text;
begin
  select string_agg(format('%s.%s', x.tbl, x.col), ', ') into v_missing
  from (values
    ('job_candidates', 'id'), ('job_candidates', 'profession'),
    ('job_requests', 'id'), ('job_requests', 'position_title')
  ) as x(tbl, col)
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = x.tbl and c.column_name = x.col
  );
  if v_missing is not null then
    raise exception 'profession_catalog_keys: missing table/column(s): %. Nothing was changed.', v_missing;
  end if;
end $$;

-- 1. Backup table (service role / postgres only)
create table if not exists public.profession_key_backup (
  table_name text not null,
  row_id uuid not null,
  column_name text not null,
  old_value text not null,
  new_value text not null,
  backed_up_at timestamptz not null default now(),
  primary key (table_name, row_id, column_name)
);
alter table public.profession_key_backup enable row level security;
revoke all on public.profession_key_backup from anon, authenticated;

-- 2. Explicit mapping (old value is lower-cased and trimmed)
create temp table _profession_map (
  kind text not null,
  old_value text not null,
  new_value text not null
) on commit drop;

insert into _profession_map (kind, old_value, new_value) values
  ('candidate', 'cook', 'cook'),
  ('candidate', 'electrician', 'electrician'),
  ('candidate', 'elektrikçi', 'electrician'),
  ('candidate', 'farm worker', 'farm_worker'),
  ('candidate', 'machine operator', 'machine_operator'),
  ('candidate', 'truck driver', 'truck_driver'),
  ('request', 'cook', 'cook'),
  ('request', 'electrician', 'electrician'),
  ('request', 'elektrikçi', 'electrician');

-- 3. Candidates
with todo as (
  select c.id, c.profession::text as old_value, m.new_value
  from public.job_candidates c
  join _profession_map m
    on m.kind = 'candidate' and lower(btrim(c.profession::text)) = m.old_value
  where c.profession::text is distinct from m.new_value
), saved as (
  insert into public.profession_key_backup (table_name, row_id, column_name, old_value, new_value)
  select 'job_candidates', t.id, 'profession', t.old_value, t.new_value from todo t
  on conflict do nothing
  returning 1
)
update public.job_candidates c
set profession = t.new_value
from todo t
where c.id = t.id;

-- 4. Requests
with todo as (
  select r.id, r.position_title::text as old_value, m.new_value
  from public.job_requests r
  join _profession_map m
    on m.kind = 'request' and lower(btrim(r.position_title::text)) = m.old_value
  where r.position_title::text is distinct from m.new_value
), saved as (
  insert into public.profession_key_backup (table_name, row_id, column_name, old_value, new_value)
  select 'job_requests', t.id, 'position_title', t.old_value, t.new_value from todo t
  on conflict do nothing
  returning 1
)
update public.job_requests r
set position_title = t.new_value
from todo t
where r.id = t.id;

-- 5. Postcondition: nothing mapped is left
do $$
declare
  v_left bigint;
begin
  select
    (select count(*) from public.job_candidates c
       join _profession_map m on m.kind = 'candidate' and lower(btrim(c.profession::text)) = m.old_value
      where c.profession::text is distinct from m.new_value)
    +
    (select count(*) from public.job_requests r
       join _profession_map m on m.kind = 'request' and lower(btrim(r.position_title::text)) = m.old_value
      where r.position_title::text is distinct from m.new_value)
  into v_left;
  if v_left <> 0 then
    raise exception 'profession_catalog_keys: % row(s) still hold a legacy value. Rolled back.', v_left;
  end if;
end $$;

commit;
