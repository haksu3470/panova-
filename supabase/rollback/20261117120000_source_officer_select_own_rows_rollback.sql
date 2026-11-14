-- Rollback for 20261117120000_source_officer_select_own_rows.sql.
-- Puts staff_select_candidates back to its state after
-- 20261117100000_field_officer_registration.sql and drops the row function.
-- After this, a source-country officer's insert ... returning fails again
-- with "new row violates row-level security policy".

begin;

drop policy if exists staff_select_candidates on public.job_candidates;
create policy staff_select_candidates on public.job_candidates
  for select to authenticated
  using (
    public.is_staff()
    and (
      public.staff_can_read_candidate(id)
      or public.field_officer_owns_candidate(registered_by, referral_code)
    )
  );

-- After the policy that used it.
drop function if exists public.source_officer_sees_candidate_row(text, text);

notify pgrst, 'reload schema';

commit;
