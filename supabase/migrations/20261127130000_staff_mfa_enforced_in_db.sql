-- Staff MFA was enforced only in the UI (tabs hidden). is_staff() and the RLS
-- policies never checked the session's assurance level, so an aal1 session of a
-- staff member who must use MFA could read candidate data through the REST API.
-- Fix: staff_mfa_ok() = MFA not required for this staff member, or the JWT is aal2.
--   is_staff()            = is_staff_member() and staff_mfa_ok()
--   is_upper_management() + email_access_ok() and staff_mfa_ok()
--   is_portal_manager()   second branch + staff_mfa_ok()
--   current_staff()       + staff_mfa_ok()
-- is_staff_member() keeps the old is_staff() body (identity only). The UI gate
-- calls it so a staff member at aal1 still reaches the MFA screen.
-- While app_settings.staff_mfa_required is false and no staff row has
-- mfa_required, nothing changes for anyone.
-- Rollback: supabase/rollback/20261127130000_staff_mfa_enforced_in_db_rollback.sql
-- Backup of the previous bodies: backup.function_defs_20261127 (created below).

create table if not exists backup.function_defs_20261127 as
select p.oid::regprocedure::text as signature, pg_get_functiondef(p.oid) as definition, now() as saved_at
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_staff', 'is_upper_management', 'is_portal_manager', 'current_staff');
alter table backup.function_defs_20261127 enable row level security;

create or replace function public.staff_mfa_ok()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select not public.current_staff_mfa_required()
    or coalesce((select auth.jwt()) ->> 'aal', 'aal1') = 'aal2';
$$;

create or replace function public.is_staff_member()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.email_access_ok()
  and (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'staff'
    )
    or exists (
      select 1 from public.staff_members sm
      where sm.auth_user_id = auth.uid()
        and coalesce(sm.is_active, true)
    )
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.is_staff_member() and public.staff_mfa_ok();
$$;

create or replace function public.is_upper_management()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff' and p.staff_role = 'upper_management'
  )
  and public.email_access_ok()
  and public.staff_mfa_ok();
$$;

create or replace function public.is_portal_manager()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select public.is_upper_management()
    or (
      exists (
        select 1
        from public.staff_members sm
        where sm.auth_user_id = (select auth.uid())
          and coalesce(sm.is_active, true)
          and sm.role_level = 'upper_management'
      )
      and public.staff_mfa_ok()
    );
$$;

create or replace function public.current_staff()
returns table(staff_id uuid, role_level text, referral_code text, scope_country text, staff_name text, staff_email text)
language sql
stable
security definer
set search_path to ''
as $$
  select s.id,
         coalesce(s.role_level, p.staff_role),
         s.referral_code,
         s.scope_country,
         coalesce(s.name, p.full_name),
         lower(s.email)
  from public.profiles p
  left join public.staff_members s
    on s.auth_user_id = p.id
    or s.id = p.linked_staff_id
  where p.id = auth.uid()
    and p.role = 'staff'
    and public.email_access_ok()
    and public.staff_mfa_ok()
  order by case when s.auth_user_id = auth.uid() then 0 else 1 end
  limit 1;
$$;

revoke all on function public.staff_mfa_ok() from public, anon;
revoke all on function public.is_staff_member() from public, anon;
grant execute on function public.staff_mfa_ok() to authenticated, service_role;
grant execute on function public.is_staff_member() to authenticated, service_role;

notify pgrst, 'reload schema';
