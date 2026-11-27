-- Rollback of 20261127130000_staff_mfa_enforced_in_db.sql: restores the previous
-- bodies (MFA checked only in the UI). staff_mfa_ok() and is_staff_member() stay:
-- the portal calls is_staff_member(), and it returns what is_staff() returns here.
-- Same bodies are saved in backup.function_defs_20261127.
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path to ''
as $$
  select public.email_access_ok()
  and (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'staff')
    or exists (select 1 from public.staff_members sm where sm.auth_user_id = auth.uid() and coalesce(sm.is_active, true))
  );
$$;

create or replace function public.is_upper_management()
returns boolean language sql stable security definer set search_path to ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'staff' and p.staff_role = 'upper_management'
  );
$$;

create or replace function public.is_portal_manager()
returns boolean language sql stable security definer set search_path to ''
as $$
  select public.is_upper_management()
    or exists (
      select 1 from public.staff_members sm
      where sm.auth_user_id = (select auth.uid())
        and coalesce(sm.is_active, true)
        and sm.role_level = 'upper_management'
    );
$$;

create or replace function public.current_staff()
returns table(staff_id uuid, role_level text, referral_code text, scope_country text, staff_name text, staff_email text)
language sql stable security definer set search_path to ''
as $$
  select s.id, coalesce(s.role_level, p.staff_role), s.referral_code, s.scope_country,
         coalesce(s.name, p.full_name), lower(s.email)
  from public.profiles p
  left join public.staff_members s on s.auth_user_id = p.id or s.id = p.linked_staff_id
  where p.id = auth.uid() and p.role = 'staff' and public.email_access_ok()
  order by case when s.auth_user_id = auth.uid() then 0 else 1 end
  limit 1;
$$;

notify pgrst, 'reload schema';
