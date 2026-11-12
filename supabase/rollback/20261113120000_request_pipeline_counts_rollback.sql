-- Rollback for supabase/migrations/20261113120000_request_pipeline_counts.sql
--
-- NOT a migration. Run by hand in the SQL Editor, and only when needed.
-- ORDER: first deploy the previous app code, THEN run this file. (The new code
-- shows zeros when the view is missing, so this order is not critical.)
-- The migration changed no table or row, so nothing else needs restoring.

begin;

drop view if exists public.request_pipeline_counts;
drop function if exists public.request_pipeline_counts_for_me();

notify pgrst, 'reload schema';

commit;
