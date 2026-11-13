-- Rollback of supabase/migrations/20261113210000_demo_seed_candidate_emails.sql
-- Puts public.staff_seed_demo_data() back to its 20261113200000 version
-- (fixed demo1113.aday<N>@example.com candidate e-mails). Grants unchanged.
-- Rows already created keep the e-mail they were created with.

begin;

-- 0. Preconditions ------------------------------------------------------------

do $$
begin
  if to_regprocedure('public.staff_seed_demo_data()') is null then
    raise exception 'demo_seed_candidate_emails_rollback: staff_seed_demo_data() missing: apply 20261113200000_demo_data_tools.sql first. Nothing was changed.';
  end if;
  if to_regprocedure('public.is_portal_manager()') is null then
    raise exception 'demo_seed_candidate_emails_rollback: is_portal_manager() missing. Nothing was changed.';
  end if;
  if not exists (
    select 1 from pg_catalog.pg_proc p
    where p.oid = to_regprocedure('public.current_staff()')
      and 'staff_email' = any (p.proargnames)
  ) then
    raise exception 'demo_seed_candidate_emails_rollback: current_staff() with staff_email missing. Nothing was changed.';
  end if;
end $$;

-- 1. Seed function (20261113200000 version) --------------------------------------

create or replace function public.staff_seed_demo_data()
returns jsonb
language plpgsql
volatile
security definer
set search_path to ''
as $$
declare
  e1 constant uuid := '7c0e1000-2026-1113-0001-000000000001';
  e2 constant uuid := '7c0e1000-2026-1113-0001-000000000002';
  r1 constant uuid := '7c0e1000-2026-1113-0002-000000000001';
  r2 constant uuid := '7c0e1000-2026-1113-0002-000000000002';
  r3 constant uuid := '7c0e1000-2026-1113-0002-000000000003';
  c1 constant uuid := '7c0e1000-2026-1113-0003-000000000001';
  c2 constant uuid := '7c0e1000-2026-1113-0003-000000000002';
  c3 constant uuid := '7c0e1000-2026-1113-0003-000000000003';
  c4 constant uuid := '7c0e1000-2026-1113-0003-000000000004';
  c5 constant uuid := '7c0e1000-2026-1113-0003-000000000005';
  v_missing text;
  v_n int;
  v_m int;
  v_result jsonb := '{}'::jsonb;
begin
  if not coalesce(public.is_portal_manager(), false) then
    raise exception 'staff_role_not_allowed' using errcode = '42501';
  end if;

  -- A NOT NULL column without a default that is not filled below stops here,
  -- by name, before anything is written.
  select string_agg(t.tbl || '.' || col.column_name, ', ' order by t.tbl, col.column_name) into v_missing
  from (values
    ('employers', array['id', 'company_name', 'contact_name', 'contact_person', 'email', 'phone', 'country',
                        'city', 'assigned_sector', 'compliance_status', 'suitability_status', 'website', 'is_demo']),
    ('job_requests', array['id', 'employer_id', 'employer_name', 'sector', 'position_title', 'headcount',
                           'target_start_date', 'monthly_net_salary', 'salary_currency', 'working_hours',
                           'weekly_days', 'contract_type', 'accommodation_provided', 'food_provided',
                           'transport_provided', 'flight_covered', 'required_experience_years',
                           'required_language', 'status', 'city', 'country', 'is_demo']),
    ('job_candidates', array['id', 'full_name', 'nationality', 'phone', 'email', 'sector', 'profession',
                             'experience_years', 'passport_number', 'status', 'official_process_status',
                             'city', 'birth_year', 'language_skills', 'expected_salary', 'is_demo']),
    ('request_matches', array['id', 'request_id', 'candidate_id', 'bound_at', 'presented_at', 'employer_result',
                              'employer_decision', 'decision_source', 'decision_reason', 'decided_at',
                              'notes', 'is_demo']),
    ('interviews', array['id', 'request_id', 'candidate_id', 'employer_id', 'scheduled_at', 'status',
                         'result', 'is_demo']),
    ('job_offers', array['id', 'candidate_id', 'employer_id', 'request_id', 'employer_name', 'position_title',
                         'monthly_net_salary', 'start_date', 'terms_details', 'offer_terms', 'status', 'is_demo']),
    ('candidate_documents', array['id', 'candidate_id', 'doc_type', 'status', 'file_url', 'is_demo'])
  ) as t(tbl, covered)
  join information_schema.columns col
    on col.table_schema = 'public' and col.table_name = t.tbl
  where col.is_nullable = 'NO' and col.column_default is null
    and col.is_identity = 'NO' and col.is_generated = 'NEVER'
    and col.column_name <> all (t.covered);
  if v_missing is not null then
    raise exception 'demo_seed_missing_columns: %', v_missing using errcode = '23502';
  end if;

  -- Employers (2)
  insert into public.employers (id, company_name, contact_name, contact_person, email, phone, country, city,
                                assigned_sector, compliance_status, suitability_status, website, is_demo)
  values
    (e1, 'DEMO Balkan Yapı DOO', 'Demo Yetkili Bir', 'Demo Yetkili Bir', 'demo1113.isveren1@example.com',
     '+000 1113 1001', 'Sırbistan', 'Belgrad', 'construction', 'approved', 'suitable', 'https://example.com', true),
    (e2, 'DEMO Adriyatik Otel', 'Demo Yetkili İki', 'Demo Yetkili İki', 'demo1113.isveren2@example.com',
     '+000 1113 1002', 'Hırvatistan', 'Split', 'hospitality', 'pending', 'under_review', 'https://example.com', true)
  on conflict do nothing;
  get diagnostics v_n = row_count;
  v_result := v_result || jsonb_build_object('employers', v_n);

  -- Requests (3): construction EUR, hospitality USD, logistics EUR. All start
  -- as new_request; the matches below move R1 to interviews, R2 to
  -- presenting_candidates, R3 to searching_candidates.
  insert into public.job_requests (id, employer_id, employer_name, sector, position_title, headcount,
                                   target_start_date, monthly_net_salary, salary_currency, working_hours,
                                   weekly_days, contract_type, accommodation_provided, food_provided,
                                   transport_provided, flight_covered, required_experience_years,
                                   required_language, status, city, country, is_demo)
  values
    (r1, e1, 'DEMO Balkan Yapı DOO', 'construction', 'Kalıpçı', 2, current_date + 30, 1300, 'EUR',
     '08:00-17:00', '6', '1 yıl', true, true, true, true, 3, 'Temel İngilizce', 'new_request', 'Belgrad', 'Sırbistan', true),
    (r2, e2, 'DEMO Adriyatik Otel', 'hospitality', 'Aşçı', 3, current_date + 45, 1500, 'USD',
     'Vardiyalı', '6', 'Sezonluk', true, true, false, true, 2, 'İngilizce', 'new_request', 'Split', 'Hırvatistan', true),
    (r3, e1, 'DEMO Balkan Yapı DOO', 'logistics', 'Depo Görevlisi', 1, current_date + 60, 1100, 'EUR',
     '07:00-16:00', '5', '1 yıl', true, false, true, false, 1, null, 'new_request', 'Novi Sad', 'Sırbistan', true)
  on conflict do nothing;
  get diagnostics v_n = row_count;
  v_result := v_result || jsonb_build_object('job_requests', v_n);

  -- Candidates (5). status = candidate_status_for(official_process_status).
  insert into public.job_candidates (id, full_name, nationality, phone, email, sector, profession, experience_years,
                                     passport_number, status, official_process_status, city, birth_year,
                                     language_skills, expected_salary, is_demo)
  values
    (c1, 'Demo Aday Bir', 'Türkiye', '+000 1113 0001', 'demo1113.aday1@example.com', 'logistics', 'Depo Görevlisi',
     2, 'DEMO11130001', 'pending', null, 'İstanbul', 1995, 'Temel İngilizce', 1100, true),
    (c2, 'Demo Aday İki', 'Türkiye', '+000 1113 0002', 'demo1113.aday2@example.com', 'construction', 'Kalıpçı',
     5, 'DEMO11130002', 'reviewing', 'documents_collecting', 'Ankara', 1990, 'Temel İngilizce', 1300, true),
    (c3, 'Demo Aday Üç', 'Özbekistan', '+000 1113 0003', 'demo1113.aday3@example.com', 'construction', 'Kalıpçı',
     7, 'DEMO11130003', 'reviewing', 'work_permit_applied', 'Taşkent', 1988, 'Rusça', 1250, true),
    (c4, 'Demo Aday Dört', 'Türkiye', '+000 1113 0004', 'demo1113.aday4@example.com', 'hospitality', 'Aşçı',
     6, 'DEMO11130004', 'approved', 'visa_approved', 'İzmir', 1992, 'İngilizce', 1500, true),
    (c5, 'Demo Aday Beş', 'Özbekistan', '+000 1113 0005', 'demo1113.aday5@example.com', 'hospitality', 'Aşçı',
     3, 'DEMO11130005', 'pending', 'not_started', 'Semerkant', 1998, 'Temel İngilizce', 1400, true)
  on conflict do nothing;
  get diagnostics v_n = row_count;
  v_result := v_result || jsonb_build_object('job_candidates', v_n);

  -- Matches (5). M4 is a staff 'selected' decision (needs the RPC flag).
  insert into public.request_matches (id, request_id, candidate_id, bound_at, presented_at, notes, is_demo)
  values
    ('7c0e1000-2026-1113-0004-000000000001', r1, c2, now() - interval '10 days', now() - interval '8 days', 'Demo eşleşme', true),
    ('7c0e1000-2026-1113-0004-000000000002', r1, c3, now() - interval '10 days', now() - interval '8 days', 'Demo eşleşme', true),
    ('7c0e1000-2026-1113-0004-000000000003', r2, c5, now() - interval '6 days', now() - interval '4 days', 'Demo eşleşme', true),
    ('7c0e1000-2026-1113-0004-000000000005', r3, c1, now() - interval '2 days', null, 'Demo eşleşme, sunum bekliyor', true)
  on conflict do nothing;
  get diagnostics v_n = row_count;

  perform set_config('panova.match_decision_rpc', 'on', true);
  insert into public.request_matches (id, request_id, candidate_id, bound_at, presented_at, employer_result,
                                      employer_decision, decision_source, decision_reason, decided_at, notes, is_demo)
  values
    ('7c0e1000-2026-1113-0004-000000000004', r2, c4, now() - interval '6 days', now() - interval '4 days', 'selected',
     'selected', 'staff', 'Demo verisi', now() - interval '3 days', 'Demo eşleşme, seçildi', true)
  on conflict do nothing;
  get diagnostics v_m = row_count;
  perform set_config('panova.match_decision_rpc', 'off', true);
  v_result := v_result || jsonb_build_object('request_matches', v_n + v_m);

  -- Interviews (2), both on R1.
  insert into public.interviews (id, request_id, candidate_id, employer_id, scheduled_at, status, result, is_demo)
  values
    ('7c0e1000-2026-1113-0005-000000000001', r1, c2, e1, now() + interval '2 days', 'scheduled', null, true),
    ('7c0e1000-2026-1113-0005-000000000002', r1, c3, e1, now() - interval '5 days', 'completed', 'selected', true)
  on conflict do nothing;
  get diagnostics v_n = row_count;
  v_result := v_result || jsonb_build_object('interviews', v_n);

  -- Offers (3); currency = the request's currency.
  insert into public.job_offers (id, candidate_id, employer_id, request_id, employer_name, position_title,
                                 monthly_net_salary, start_date, terms_details, offer_terms, status, is_demo)
  values
    ('7c0e1000-2026-1113-0006-000000000001', c2, e1, r1, 'DEMO Balkan Yapı DOO', 'Kalıpçı', 1300,
     (current_date + 30)::text, 'Demo teklif: konaklama, yemek ve ulaşım işverene ait',
     jsonb_build_object('currency', 'EUR'), 'pending', true),
    ('7c0e1000-2026-1113-0006-000000000002', c3, e1, r1, 'DEMO Balkan Yapı DOO', 'Kalıpçı', 1350,
     (current_date + 30)::text, 'Demo teklif: konaklama, yemek ve ulaşım işverene ait',
     jsonb_build_object('currency', 'EUR'), 'accepted', true),
    ('7c0e1000-2026-1113-0006-000000000003', c4, e2, r2, 'DEMO Adriyatik Otel', 'Aşçı', 1500,
     (current_date + 45)::text, 'Demo teklif: sezonluk sözleşme, konaklama dahil',
     jsonb_build_object('currency', 'USD'), 'accepted', true)
  on conflict do nothing;
  get diagnostics v_n = row_count;
  v_result := v_result || jsonb_build_object('job_offers', v_n);

  -- Documents (6), no file: pending or rerequested only.
  insert into public.candidate_documents (id, candidate_id, doc_type, status, file_url, is_demo)
  values
    ('7c0e1000-2026-1113-0007-000000000001', c1, 'passport', 'pending', null, true),
    ('7c0e1000-2026-1113-0007-000000000002', c1, 'cv', 'pending', null, true),
    ('7c0e1000-2026-1113-0007-000000000003', c2, 'passport', 'rerequested', null, true),
    ('7c0e1000-2026-1113-0007-000000000004', c2, 'health_report', 'pending', null, true),
    ('7c0e1000-2026-1113-0007-000000000005', c3, 'criminal_record', 'pending', null, true),
    ('7c0e1000-2026-1113-0007-000000000006', c4, 'diploma', 'rerequested', null, true)
  on conflict do nothing;
  get diagnostics v_n = row_count;
  v_result := v_result || jsonb_build_object('candidate_documents', v_n);

  return v_result;
end;
$$;

-- 2. Postconditions -----------------------------------------------------------

do $$
declare
  v_fn constant text := 'public.staff_seed_demo_data()';
begin
  if to_regprocedure(v_fn) is null then
    raise exception 'demo_seed_candidate_emails_rollback: % is missing', v_fn;
  end if;
  if not (select p.prosecdef from pg_catalog.pg_proc p where p.oid = to_regprocedure(v_fn)) then
    raise exception 'demo_seed_candidate_emails_rollback: % is not SECURITY DEFINER', v_fn;
  end if;
  if not has_function_privilege('authenticated', v_fn, 'execute') then
    raise exception 'demo_seed_candidate_emails_rollback: authenticated cannot execute %', v_fn;
  end if;
  if has_function_privilege('anon', v_fn, 'execute') then
    raise exception 'demo_seed_candidate_emails_rollback: anon can still execute %', v_fn;
  end if;
end $$;

notify pgrst, 'reload schema';
commit;
