-- Review-only script. It ends with ROLLBACK, so running it does not delete anything
-- until that line is changed to COMMIT after the preview counts look right.
-- Do not run this against production from an agent or from CI.
--
-- Linked accounts are kept even when is_demo was set on them.
-- Example: employers.id 428c22db-e80e-4bfe-813a-c73cf0129d53 (AKAY EĞİTİM)
-- is is_demo = true and has auth_user_id set. wipe_demo_data() would delete it.
-- This script does not.

-- Preview
select 'employers_unlinked_demo' as bucket, count(*)
  from public.employers where is_demo and auth_user_id is null
union all
select 'candidates_unlinked_demo', count(*)
  from public.job_candidates where is_demo and auth_user_id is null
union all
select 'requests_demo_unlinked_employer', count(*)
  from public.job_requests r
  where r.is_demo
    and (r.employer_id is null or exists (
      select 1 from public.employers e
      where e.id = r.employer_id and e.is_demo and e.auth_user_id is null
    ))
union all
select 'documents_on_unlinked_demo_candidates', count(*)
  from public.candidate_documents d
  join public.job_candidates c on c.id = d.candidate_id
  where d.is_demo and c.is_demo and c.auth_user_id is null
union all
select 'offers_on_unlinked_demo_candidates', count(*)
  from public.job_offers o
  join public.job_candidates c on c.id = o.candidate_id
  where o.is_demo and c.is_demo and c.auth_user_id is null
union all
select 'linked_demo_employers_kept', count(*)
  from public.employers where is_demo and auth_user_id is not null
union all
select 'linked_demo_candidates_kept', count(*)
  from public.job_candidates where is_demo and auth_user_id is not null;

begin;

-- Children of unlinked demo candidates.
delete from public.candidate_documents d
using public.job_candidates c
where d.candidate_id = c.id
  and d.is_demo
  and c.is_demo
  and c.auth_user_id is null;

delete from public.job_offers o
using public.job_candidates c
where o.candidate_id = c.id
  and o.is_demo
  and c.is_demo
  and c.auth_user_id is null;

delete from public.interviews i
using public.job_candidates c
where i.candidate_id = c.id
  and i.is_demo
  and c.is_demo
  and c.auth_user_id is null;

delete from public.request_matches m
using public.job_candidates c
where m.candidate_id = c.id
  and m.is_demo
  and c.is_demo
  and c.auth_user_id is null;

delete from public.placement_followups f
using public.job_candidates c
where f.candidate_id = c.id
  and f.is_demo
  and c.is_demo
  and c.auth_user_id is null;

delete from public.candidate_notifications n
using public.job_candidates c
where n.candidate_id = c.id
  and n.is_demo
  and c.is_demo
  and c.auth_user_id is null;

delete from public.candidate_support_tickets t
using public.job_candidates c
where t.candidate_id = c.id
  and t.is_demo
  and c.is_demo
  and c.auth_user_id is null;

update public.job_candidates
   set active_request_id = null,
       active_employer_id = null
 where is_demo
   and auth_user_id is null;

delete from public.job_candidates
 where is_demo
   and auth_user_id is null;

delete from public.job_requests r
 where r.is_demo
   and (
     r.employer_id is null
     or exists (
       select 1 from public.employers e
       where e.id = r.employer_id and e.is_demo and e.auth_user_id is null
     )
   );

delete from public.tasks where is_demo;

delete from public.employers
 where is_demo
   and auth_user_id is null;

-- Change ROLLBACK to COMMIT only after the preview and a manual review.
rollback;
