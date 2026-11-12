-- Read-only checks to run after 20261110120000, 20261110121000, and
-- 20261110122000. Do not change data. Sign in as each role in the SQL editor
-- with `set request.jwt.claim.sub` is not enough; use the Supabase dashboard
-- impersonation or a one-off `select` as the user via the API.
--
-- As postgres, these queries only describe the rules. They do not log in.

-- Upper management is still the bypass.
-- Expect is_portal_manager() true only for that role. Run as that user:
--   select public.is_portal_manager();

-- Source officer: candidates outside the referral code and scope country
-- must come back empty. Replace the uuid.
--   select id from public.job_candidates
--   where id = '<other candidate uuid>';

-- Target officer with scope_country set: employers in another country empty.
--   select id, country from public.employers;

-- Field officer: candidates with no task assigned to them empty.
--   select id from public.job_candidates;

-- Tasks: a non-manager sees only assignee / backup / creator rows.
--   select id, assignee, backup_assignee from public.tasks;

-- Demand rows that still contradict their matches (should be zero after the
-- workflow migration):
select r.id, r.status
from public.job_requests r
where r.status = 'presenting_candidates'
  and not exists (
    select 1 from public.request_matches m
    where m.request_id = r.id and m.presented_at is not null
  );

select r.id, r.status
from public.job_requests r
where r.status = 'interviews'
  and not exists (
    select 1 from public.interviews i where i.request_id = r.id
  );

-- Legacy data URLs still in place (expected until each file is re-uploaded):
select count(*) as legacy_data_urls
from public.candidate_documents
where file_url like 'data:%';

-- MFA stays off until an operator updates the flag:
select key, value from public.app_settings where key = 'staff_mfa_required';
