-- Rollback of 20261126120000_process_metrics.sql
-- Removes the metrics function, the history table (and its rows) and the
-- employment end columns (and their values). Export them first if you need them.
begin;

drop function if exists public.staff_process_metrics(boolean);

drop trigger if exists job_candidates_guard_employment_end on public.job_candidates;
drop function if exists public.guard_candidate_employment_end();
alter table public.job_candidates drop constraint if exists job_candidates_employment_end_check;
alter table public.job_candidates drop column if exists employment_end_reason;
alter table public.job_candidates drop column if exists employment_ended_on;

drop trigger if exists job_candidates_record_process_change on public.job_candidates;
drop function if exists public.record_candidate_process_change();
drop table if exists public.candidate_process_history;

commit;
