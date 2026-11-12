-- Rollback for supabase/migrations/20261113130000_interview_meeting_url.sql
--
-- NOT a migration. Run by hand in the SQL Editor, and only when needed.
-- ORDER: first deploy the previous app code (the new code writes meeting_url),
-- THEN run this file.
--
-- Removed: the role trigger, its function and the http/https constraint.
-- Kept: the column and the links already entered, and employer_select_own
-- (the migration re-created it with the same definition it had before).
-- Dropping the column is at the end, commented out (irreversible).

begin;

drop trigger if exists interviews_guard_meeting_url on public.interviews;
drop function if exists public.guard_interview_meeting_url();

alter table public.interviews
  drop constraint if exists interviews_meeting_url_check;

-- alter table public.interviews drop column if exists meeting_url;

notify pgrst, 'reload schema';

commit;
