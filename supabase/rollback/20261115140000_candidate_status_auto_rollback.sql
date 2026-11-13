-- Rollback of 20261115140000_candidate_status_auto.sql.
-- 1) restores the old candidate statuses from public.candidate_status_backup,
-- 2) puts back the part-1 guard (staff-only protected fields, no derivation, no use_rpc rule),
-- 3) drops the manual override RPC and the derivation function.
-- public.candidate_status_backup is kept. Deploy the previous staff UI together with this rollback
-- (the new UI calls staff_set_candidate_status).
begin;

alter table public.job_candidates disable trigger job_candidates_guard_process_fields;
update public.job_candidates c
set status = b.old_status
from public.candidate_status_backup b
where b.candidate_id = c.id and b.old_status is not null;
alter table public.job_candidates enable trigger job_candidates_guard_process_fields;

create or replace function public.guard_candidate_process_fields()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_app_user boolean := coalesce(current_setting('role', true), '') in ('anon', 'authenticated');
begin
  if not v_app_user then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not (coalesce(auth.uid() is not null, false) and public.is_staff()) then
      new.status := 'pending';
      new.official_process_status := null;
      new.travel_status := 'planned';
      new.flight_date := null;
      new.active_request_id := null;
    end if;
    return new;
  end if;

  if new.status is not distinct from old.status
     and new.official_process_status is not distinct from old.official_process_status
     and new.travel_status is not distinct from old.travel_status
     and new.flight_date is not distinct from old.flight_date
     and new.active_request_id is not distinct from old.active_request_id then
    return new;
  end if;
  if public.is_staff() then
    return new;
  end if;
  raise exception 'candidate_process_fields_staff_only' using errcode = '42501';
end;
$$;

drop function if exists public.staff_set_candidate_status(uuid, text, text);
drop function if exists public.candidate_status_for(text, uuid, text);

notify pgrst, 'reload schema';
commit;
