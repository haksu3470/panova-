-- Map remaining Turkish demo free-text professions/titles to catalog keys.
-- Uses public.profession_key_backup (created in 20261115130000).
-- Rollback: supabase/rollback/20261117210000_profession_catalog_keys_tr_demo_rollback.sql
begin;

do $$
begin
  if to_regclass('public.profession_key_backup') is null then
    raise exception 'profession_catalog_keys_tr_demo: profession_key_backup missing. Apply 20261115130000 first.';
  end if;
end $$;

create temp table _profession_map (
  kind text not null,
  old_value text not null,
  new_value text not null
) on commit drop;

insert into _profession_map (kind, old_value, new_value) values
  ('candidate', 'aşçı', 'cook'),
  ('candidate', 'kalıpçı', 'carpenter'),
  ('candidate', 'depo görevlisi', 'warehouse_worker'),
  ('request', 'aşçı', 'cook'),
  ('request', 'kalıpçı', 'carpenter'),
  ('request', 'depo görevlisi', 'warehouse_worker');

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

notify pgrst, 'reload schema';
commit;
