-- Geri alma: anon_register_candidate kuralını canlıdaki eski haliyle geri koyar.
begin;
drop policy if exists anon_register_candidate on public.job_candidates;
create policy anon_register_candidate on public.job_candidates
  for insert to anon
  with check ((auth_user_id is null) and (coalesce(is_verified, false) = false));
commit;
notify pgrst, 'reload schema';
