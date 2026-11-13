-- Rollback for 20261116130000_video_role_from_staff_members.sql.
-- Puts back the live definition from 20261104180000_candidate_youtube_video.sql:
-- the role is read only from profiles.staff_role.

begin;

create or replace function public.can_manage_candidate_video()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'staff'
      and p.staff_role in ('upper_management', 'source_country', 'target_country')
  );
$$;

revoke all on function public.can_manage_candidate_video() from public, anon;
grant execute on function public.can_manage_candidate_video() to authenticated;

notify pgrst, 'reload schema';

commit;
