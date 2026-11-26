-- Rollback of 20261126150000_candidate_portal_view_permission.sql
-- Revert the app code first: without the function the candidate portal's
-- staff view stays closed to everyone (the rpc fails and reads as "no").
begin;

drop function if exists public.can_view_candidate_portal();
alter table public.staff_members drop column if exists can_view_candidate_portal;

commit;
