-- Who may open a candidate's portal as staff (/candidate?as=<id>).
-- Upper management always; other staff only when upper management turns on
-- staff_members.can_view_candidate_portal for them (default off).
-- Changed like mfa_required: staff_update_staff (is_portal_manager()).
-- What the page then reads is still limited by the existing staff RLS.
--
-- One transaction, idempotent.
-- Rollback: supabase/rollback/20261126150000_candidate_portal_view_permission_rollback.sql

begin;

do $$
begin
  if to_regprocedure('public.is_upper_management()') is null then
    raise exception 'is_upper_management() missing. Nothing was changed.';
  end if;
end $$;

alter table public.staff_members add column if not exists can_view_candidate_portal boolean not null default false;

create or replace function public.can_view_candidate_portal()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.is_staff() and (
    public.is_upper_management()
    or exists (
      select 1 from public.staff_members sm
      where sm.auth_user_id = auth.uid()
        and coalesce(sm.is_active, true)
        and sm.can_view_candidate_portal
    )
  );
$$;

revoke all on function public.can_view_candidate_portal() from public, anon;
grant execute on function public.can_view_candidate_portal() to authenticated;

commit;
