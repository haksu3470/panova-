-- Rollback of 20261127140000_self_service_field_guard.sql: restores the previous state.
drop trigger if exists job_candidates_guard_self_service on public.job_candidates;
drop trigger if exists employers_guard_self_service on public.employers;
drop function if exists public.guard_self_service_fields();

create policy anon_register_candidate on public.job_candidates
  for insert to anon
  with check ((auth_user_id is null) and (coalesce(is_verified, false) = false));
create policy anon_register_employer on public.employers
  for insert to anon
  with check (auth_user_id is null);
grant insert on public.job_candidates to anon;
grant insert on public.employers to anon;
grant all on public.app_settings to anon;
grant all on public.contact_submissions to anon;

notify pgrst, 'reload schema';
