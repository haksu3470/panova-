-- Interview meeting link (docs/gorev-talep-akisi.md, goal 4).
--
-- interviews.meeting_url: staff enter it, the employer opens it with
-- "Mülakata Katıl".
--
-- Rules (enforced here, not only in the UI):
--   1. Only http(s) links with a host are stored; javascript:, data:, ftp: and
--      scheme-less values are rejected (interviews_meeting_url_check). Same
--      rule as lib/interviewMeeting.ts (isSafeMeetingUrl).
--   2. Only upper_management and target_country may set, change or clear the
--      link (trigger interviews_guard_meeting_url). source_country and
--      field_officer can still edit the rest of an interview through
--      staff_update_interviews, but not this column. Employers cannot set it
--      either, also not through employer_request_interview.
--      target_country stays limited to its scope by the existing RLS
--      (staff_update_interviews -> staff_can_read_candidate).
--   3. The employer reads only its own interviews (employer_select_own,
--      re-created here unchanged) and has no UPDATE policy; the trigger blocks
--      the column even if such a policy is added later.
--   Trusted server-side callers (postgres, supabase_admin, service_role) are
--   not limited by the role rule; the check constraint still applies to them.
--
-- One transaction, idempotent. No existing row changes: the new column
-- starts null.
-- Rollback: supabase/rollback/20261113130000_interview_meeting_url_rollback.sql
-- Checks:   supabase/verification/interview_meeting_url.sql
-- Scenario: supabase/verification/interview_meeting_url_scenario.sql

begin;

-- 0. scheduled_at must keep its time zone. Stop instead of converting the type.
do $$
declare
  v_type text;
begin
  select data_type into v_type
  from information_schema.columns
  where table_schema = 'public' and table_name = 'interviews' and column_name = 'scheduled_at';
  if v_type is distinct from 'timestamp with time zone' then
    raise exception 'interviews.scheduled_at is "%" (expected timestamp with time zone); not changed here', v_type;
  end if;
end $$;

-- 1. Column and http/https check ----------------------------------------------

alter table public.interviews
  add column if not exists meeting_url text;

alter table public.interviews
  drop constraint if exists interviews_meeting_url_check;
alter table public.interviews
  add constraint interviews_meeting_url_check check (
    meeting_url is null
    or (
      length(meeting_url) <= 2000
      and meeting_url ~* '^https?://[^\s/?#@]+([/?#][^\s]*)?$'
    )
  );

comment on column public.interviews.meeting_url is
  'Online meeting link (http/https only). Set by upper_management or target_country only; shown to the employer of the interview as "Mülakata Katıl".';

-- 2. Who may write the link ---------------------------------------------------
-- SECURITY INVOKER on purpose: current_user is then the caller's role
-- (authenticated, service_role, postgres ...), which a SECURITY DEFINER
-- function would hide. current_staff() is itself SECURITY DEFINER and
-- executable by authenticated. search_path is pinned all the same.

create or replace function public.guard_interview_meeting_url()
returns trigger
language plpgsql
security invoker
set search_path to ''
as $$
declare
  v_role text;
begin
  if tg_op = 'INSERT' then
    if new.meeting_url is null then
      return new;
    end if;
  elsif new.meeting_url is not distinct from old.meeting_url then
    return new;
  end if;

  -- Server-side callers without an end user (SQL editor, service key).
  if current_user in ('postgres', 'supabase_admin', 'service_role')
     or coalesce((select auth.role()), '') = 'service_role' then
    return new;
  end if;

  select lower(me.role_level) into v_role
  from public.current_staff() me
  limit 1;

  if v_role is null or v_role not in ('upper_management', 'target_country') then
    raise exception 'meeting_url_role_not_allowed' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_interview_meeting_url() from public, anon;
grant execute on function public.guard_interview_meeting_url() to authenticated;

drop trigger if exists interviews_guard_meeting_url on public.interviews;
create trigger interviews_guard_meeting_url
  before insert or update of meeting_url on public.interviews
  for each row
  execute function public.guard_interview_meeting_url();

-- 3. Employer reads own interviews only (unchanged definition) -----------------

drop policy if exists employer_select_own on public.interviews;
create policy employer_select_own on public.interviews
  for select to authenticated
  using (employer_id is not null and employer_id = public.my_employer_id());

notify pgrst, 'reload schema';

commit;
