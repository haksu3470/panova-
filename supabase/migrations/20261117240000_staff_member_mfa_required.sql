-- Per-staff MFA requirement (upper management assigns on Ekip & Yetkiler cards).
-- Gate uses: app_settings.staff_mfa_required OR staff_members.mfa_required.

alter table public.staff_members
  add column if not exists mfa_required boolean not null default false;

comment on column public.staff_members.mfa_required is
  'When true, this staff account must complete TOTP MFA (aal2) even if org-wide staff_mfa_required is false.';

create or replace function public.current_staff_mfa_required()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select coalesce(
    (select (s.value #>> '{}')::boolean from public.app_settings s where s.key = 'staff_mfa_required'),
    false
  )
  or coalesce(
    (
      select sm.mfa_required
      from public.staff_members sm
      where sm.auth_user_id = auth.uid()
      limit 1
    ),
    false
  );
$$;

revoke all on function public.current_staff_mfa_required() from public, anon;
grant execute on function public.current_staff_mfa_required() to authenticated;
