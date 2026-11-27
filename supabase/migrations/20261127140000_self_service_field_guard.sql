-- Candidates and employers could change internal fields on their own row:
-- cand_self_update / emp_self_update allow every column, and the existing
-- triggers only protect status/process fields and referral_code/registered_by.
-- Fix: guard_self_service_fields() keeps staff-only columns unchanged when a
-- non-staff app user (anon/authenticated without is_staff()) updates the row.
-- Staff writes and service_role are untouched.
-- Also: anon could INSERT into job_candidates / employers directly with the
-- public key. The app registers through link_my_candidate()/link_my_employer()
-- (security definer) and never inserts as anon, so the anon INSERT policies and
-- grants go. Extra anon grants on app_settings / contact_submissions go too
-- (contact form keeps INSERT).
-- Rollback: supabase/rollback/20261127140000_self_service_field_guard_rollback.sql

create or replace function public.guard_self_service_fields()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  if coalesce(current_setting('role', true), '') not in ('anon', 'authenticated') or public.is_staff() then
    return new;
  end if;
  if tg_table_name = 'job_candidates' then
    new.is_verified := old.is_verified;
    new.equivalence_status := old.equivalence_status;
    new.assigned_to := old.assigned_to;
    new.assigned_backup := old.assigned_backup;
    new.active_employer_id := old.active_employer_id;
    new.archived_at := old.archived_at;
    new.closed_reason := old.closed_reason;
    new.is_demo := old.is_demo;
    new.notes := old.notes;
    new.employment_ended_on := old.employment_ended_on;
    new.employment_end_reason := old.employment_end_reason;
  elsif tg_table_name = 'employers' then
    new.compliance_status := old.compliance_status;
    new.suitability_status := old.suitability_status;
    new.assigned_to := old.assigned_to;
    new.assigned_sector := old.assigned_sector;
    new.is_demo := old.is_demo;
    new.notes := old.notes;
    new.access_code := old.access_code;
    new.archived_at := old.archived_at;
    new.invited_at := old.invited_at;
    new.invited_by := old.invited_by;
    new.invite_sent_at := old.invite_sent_at;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_self_service_fields() from public, anon, authenticated;

drop trigger if exists job_candidates_guard_self_service on public.job_candidates;
create trigger job_candidates_guard_self_service
  before update on public.job_candidates
  for each row execute function public.guard_self_service_fields();

drop trigger if exists employers_guard_self_service on public.employers;
create trigger employers_guard_self_service
  before update on public.employers
  for each row execute function public.guard_self_service_fields();

drop policy if exists anon_register_candidate on public.job_candidates;
drop policy if exists anon_register_employer on public.employers;
revoke insert on public.job_candidates from anon;
revoke insert on public.employers from anon;
revoke all on public.app_settings from anon;
revoke all on public.contact_submissions from anon;
grant insert on public.contact_submissions to anon;

notify pgrst, 'reload schema';
