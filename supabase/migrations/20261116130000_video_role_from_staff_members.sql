-- YouTube permission reads the role from one place: staff_members.
--
-- Before: can_manage_candidate_video() looked only at profiles.staff_role.
-- Two upper-management accounts have an empty profiles.staff_role (their role
-- is only in staff_members.role_level), so they could not save a video.
--
-- After: the role comes from current_staff().role_level, the same source as
-- the read-scope rules, staff_decide_match and the meeting-link guard.
-- Allowed roles are unchanged: upper_management, source_country,
-- target_country. guard_candidate_youtube_video() calls this function, so the
-- trigger follows without being changed.
--
-- Rollback: supabase/rollback/20261116130000_video_role_from_staff_members_rollback.sql
-- Test (rolled back): supabase/verification/video_role_from_staff_members.sql
-- Do not apply this file from CI. Review it, then run it by hand.

begin;

do $$
begin
  if to_regprocedure('public.can_manage_candidate_video()') is null then
    raise exception 'public.can_manage_candidate_video() yok. Önce 20261104180000_candidate_youtube_video.sql. Hiçbir şey değiştirilmedi.';
  end if;
  if to_regprocedure('public.current_staff()') is null then
    raise exception 'public.current_staff() yok. Önce 20261110120000_staff_read_scope.sql. Hiçbir şey değiştirilmedi.';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.job_candidates'::regclass
      and tgfoid = 'public.guard_candidate_youtube_video()'::regprocedure
  ) then
    raise exception 'job_candidates üzerinde guard_candidate_youtube_video tetikleyicisi yok. Hiçbir şey değiştirilmedi.';
  end if;
end
$$;

create or replace function public.can_manage_candidate_video()
returns boolean
language sql
stable
security definer
set search_path to ''
as $$
  select exists (
    select 1
    from public.current_staff() me
    where lower(me.role_level) in ('upper_management', 'source_country', 'target_country')
  );
$$;

revoke all on function public.can_manage_candidate_video() from public, anon;
grant execute on function public.can_manage_candidate_video() to authenticated;

notify pgrst, 'reload schema';

commit;
