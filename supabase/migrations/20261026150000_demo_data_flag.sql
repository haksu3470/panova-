-- Demo veri altyapısı: is_demo bayrağı + wipe_demo_data()
do $$
declare t text;
begin
  foreach t in array array['job_candidates','employers','job_requests','request_matches','interviews',
    'candidate_documents','job_offers','placement_followups','tasks','candidate_notifications',
    'candidate_support_tickets','applicants','audit_logs','staff_members','portal_users']
  loop
    execute format('alter table public.%I add column if not exists is_demo boolean not null default false', t);
    execute format('create index if not exists %I on public.%I (is_demo) where is_demo', t||'_is_demo_idx', t);
  end loop;
end $$;

-- Mevcut tüm kayıtları demo işaretle (gerçek Auth'a bağlı personel hariç)
update public.job_candidates set is_demo = true where auth_user_id is null;
update public.employers set is_demo = true where auth_user_id is null;
update public.job_requests set is_demo = true;
update public.request_matches set is_demo = true;
update public.interviews set is_demo = true;
update public.candidate_documents set is_demo = true;
update public.job_offers set is_demo = true;
update public.placement_followups set is_demo = true;
update public.tasks set is_demo = true;
update public.candidate_notifications set is_demo = true;
update public.candidate_support_tickets set is_demo = true;
update public.applicants set is_demo = true;
update public.portal_users set is_demo = true;
update public.staff_members s set is_demo = true
 where s.auth_user_id is null
   and lower(s.email) <> 'huseyinaksu@gmail.com'
   and not exists (select 1 from public.profiles p where p.linked_staff_id = s.id);

-- Canlıya geçişte tüm demo kayıtları siler. Sadece personel (is_staff) veya service_role çağırabilir.
create or replace function public.wipe_demo_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare r jsonb := '{}'::jsonb; n int; t text;
begin
  if not (coalesce(auth.role(),'') = 'service_role' or current_user in ('postgres','supabase_admin') or public.is_staff()) then
    raise exception 'wipe_demo_data: yetkisiz (sadece personel)';
  end if;
  foreach t in array array['audit_logs','candidate_support_tickets','candidate_notifications','placement_followups',
    'job_offers','interviews','request_matches','candidate_documents','tasks','applicants']
  loop
    execute format('delete from public.%I where is_demo', t); get diagnostics n = row_count; r := r || jsonb_build_object(t, n);
  end loop;
  -- adaylar → talepler → işverenler (FK sırası)
  update public.job_candidates set active_request_id = null, active_employer_id = null where is_demo;
  delete from public.job_candidates where is_demo; get diagnostics n = row_count; r := r || jsonb_build_object('job_candidates', n);
  delete from public.job_requests where is_demo; get diagnostics n = row_count; r := r || jsonb_build_object('job_requests', n);
  delete from public.employers where is_demo; get diagnostics n = row_count; r := r || jsonb_build_object('employers', n);
  delete from public.staff_members s where is_demo and auth_user_id is null
    and not exists (select 1 from public.profiles p where p.linked_staff_id = s.id);
  get diagnostics n = row_count; r := r || jsonb_build_object('staff_members', n);
  delete from public.portal_users where is_demo; get diagnostics n = row_count; r := r || jsonb_build_object('portal_users', n);
  return r;
end $$;
revoke all on function public.wipe_demo_data() from public, anon;
grant execute on function public.wipe_demo_data() to authenticated, service_role;
