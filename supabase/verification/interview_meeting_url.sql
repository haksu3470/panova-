-- Checks for 20261113130000_interview_meeting_url.sql.
-- Every query here is read-only. The role rules are exercised by
-- supabase/verification/interview_meeting_url_scenario.sql (ends in rollback).

-- 0. BEFORE applying: scheduled_at keeps its time zone, and the column does
--    not exist yet. Expect "timestamp with time zone" and no meeting_url row.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'interviews'
  and column_name in ('scheduled_at', 'meeting_url');

-- 0b. BEFORE and AFTER applying: the interview policies.
--     Expect employer_select_own (SELECT) and the staff_* policies, and no
--     UPDATE or ALL policy an employer could use.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'interviews'
order by cmd, policyname;

-- 1. AFTER applying: column, constraint, trigger.
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'interviews' and column_name = 'meeting_url';

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.interviews'::regclass and conname = 'interviews_meeting_url_check';

-- Expect one row: interviews_guard_meeting_url, enabled ('O'), and a
-- definition with "BEFORE INSERT OR UPDATE OF meeting_url".
select tgname, tgenabled, pg_get_triggerdef(oid)
from pg_trigger
where tgrelid = 'public.interviews'::regclass and tgname = 'interviews_guard_meeting_url';

-- 1b. Trigger function: pinned search_path, and no execute for PUBLIC/anon.
--     Expect prosecdef = false, proconfig = {search_path=""},
--     anon_can_execute = false, authenticated_can_execute = true,
--     public_in_acl = false.
select p.proname,
       p.prosecdef,
       p.proconfig,
       has_function_privilege('anon', p.oid, 'execute') as anon_can_execute,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated_can_execute,
       exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
               where a.grantee = 0 and a.privilege_type = 'EXECUTE') as public_in_acl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'guard_interview_meeting_url';

-- 1c. The URL rule itself, without touching any row. Expect ok = true on
--     every line.
select v.url, v.expected,
       (v.url ~* '^https?://[^\s/?#@]+([/?#][^\s]*)?$' and length(v.url) <= 2000) = v.expected as ok
from (values
  ('https://meet.google.com/abc-defg-hij', true),
  ('http://ornek.com/toplanti', true),
  ('https://zoom.us/j/123?pwd=x', true),
  ('HTTPS://ORNEK.COM/x', true),
  ('javascript:alert(1)', false),
  ('JavaScript:alert(1)', false),
  ('javascript://ornek.com/%0Aalert(1)', false),
  ('data:text/html,<b>x</b>', false),
  ('ftp://ornek.com/x', false),
  ('ornek.com/toplanti', false),
  ('https://user@evil.com', false),
  ('https:// space.com', false)
) as v(url, expected);

-- 2. Rows that would fail the check (expect 0). Useful after a manual import.
select count(*) as invalid_links
from public.interviews
where meeting_url is not null
  and not (length(meeting_url) <= 2000
           and meeting_url ~* '^https?://[^\s/?#@]+([/?#][^\s]*)?$');
