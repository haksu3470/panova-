-- Source-country officers: SELECT checks the row's own columns.
--
-- Problem: the portal registers a candidate with insert(...).select(...)
-- (INSERT ... RETURNING). For the returned row PostgreSQL also applies the
-- SELECT policy. staff_select_candidates reaches source_country only through
-- staff_can_read_candidate(id), which looks the candidate up by id; a STABLE
-- function cannot see the row the same command is inserting, so a
-- source-country officer got "new row violates row-level security policy"
-- (supabase/verification/field_officer_registration.sql, step e2).
-- Field officers already have a row check (field_officer_owns_candidate,
-- 20261117100000_field_officer_registration.sql).
--
-- Fix: source_officer_sees_candidate_row(referral_code, nationality) is the
-- source_country branch of staff_can_read_candidate (20261110120000_staff_read_scope.sql,
-- not changed since) written against the row's own columns: same code or the
-- same country as scope_country. No new right: it opens exactly the rows the
-- id-based branch opens, only without the lookup.
--
-- Only the SELECT policy changes. staff_can_read_candidate, the UPDATE /
-- DELETE policies and every other table are not touched.
--
-- Rollback: supabase/rollback/20261117120000_source_officer_select_own_rows_rollback.sql
-- Test (nothing kept): supabase/verification/field_officer_registration.sql
-- Do not apply this file from CI. Review it, then run it by hand.

begin;

do $$
begin
  if to_regprocedure('public.current_staff()') is null
     or to_regprocedure('public.country_key(text)') is null
     or to_regprocedure('public.staff_can_read_candidate(uuid)') is null then
    raise exception 'current_staff() / country_key() / staff_can_read_candidate() yok. Önce 20261110120000_staff_read_scope.sql. Hiçbir şey değiştirilmedi.';
  end if;
  if to_regprocedure('public.field_officer_owns_candidate(uuid,text)') is null then
    raise exception 'field_officer_owns_candidate() yok. Önce 20261117100000_field_officer_registration.sql. Hiçbir şey değiştirilmedi.';
  end if;
end
$$;

-- Same rule as the source_country branch of staff_can_read_candidate:
--   (me.referral_code is not null and c.referral_code = me.referral_code)
--   or (country_key(me.scope_country) is not null
--       and country_key(c.nationality) = country_key(me.scope_country))
create or replace function public.source_officer_sees_candidate_row(p_referral_code text, p_nationality text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (
    select 1
    from public.current_staff() me
    where me.role_level = 'source_country'
      and (
        (me.referral_code is not null and p_referral_code = me.referral_code)
        or (
          public.country_key(me.scope_country) is not null
          and public.country_key(p_nationality) = public.country_key(me.scope_country)
        )
      )
  );
$$;

revoke all on function public.source_officer_sees_candidate_row(text, text) from public, anon;
grant execute on function public.source_officer_sees_candidate_row(text, text) to authenticated;

-- SELECT only. Earlier conditions stay; the new one is checked on the row itself.
drop policy if exists staff_select_candidates on public.job_candidates;
create policy staff_select_candidates on public.job_candidates
  for select to authenticated
  using (
    public.is_staff()
    and (
      public.staff_can_read_candidate(id)
      or public.field_officer_owns_candidate(registered_by, referral_code)
      or public.source_officer_sees_candidate_row(referral_code, nationality)
    )
  );

notify pgrst, 'reload schema';

commit;
