-- Scenario test for public.employer_placements() (F3-5,
-- 20261115120000_employer_placements.sql).
--
--   0  setup: employer A selects / rejects / undoes through its own RPC
--      (employer_decide_match), exactly as the employer page does
--   1  employer A sees exactly its selected test candidates (c1, c2, c3 and
--      the archived c8)
--   2  stage per row from candidate_pipeline_stage:
--      c1 in_process, c2 travel_ready, c3 started, c8 in_process
--   3  employer A does not see employer B's selected candidate (c7)
--   4  not selected (c4, pending) and rejected (c6) are not returned
--   5  c5 is returned while selected and drops out once the selection is
--      undone (selected -> pending)
--   6  start_date only from the ACCEPTED offer of this request:
--      c2 2026-12-01, c3 2026-11-20, c1 (pending offer only) null
--   7  flight_date comes back as the stored free text, with the other
--      flight fields
--   8  follow-ups: only this request's 30/60 rows for c3, each item only
--      {period_stage, check_date, status}; 30 completed, 60 planned;
--      employer B's follow-up row for c3 is not returned
--   9  no passport / phone / e-mail / pnr / accommodation / feedback / note
--      field in the result: neither as a key nor as a value (the test
--      candidates' own values are searched for in the whole result)
--  10  anon cannot call the function
--  11  a signed-in user who is not an employer gets zero rows; employer A
--      without e-mail proof gets zero rows (email_access_ok)
--  12  employer B (when B has a verified account) sees c7 and none of A's
--  13  list and cards agree for request R1 (request_pipeline_counts_for_me,
--      same call, same user): rows = 'selected', and the rows per stage =
--      in_process / travel_ready / started. c8 is archived
--      (job_candidates.archived_at set): the cards count it, so the list
--      must return it too
--
-- NOTHING IS KEPT. The whole file runs between `begin;` and `rollback;`.
-- There is no commit statement in this file. Section 11 removes employer A's
-- e-mail proof inside a sub-block that is undone at once.
--
-- Run it in the Supabase SQL Editor (or psql) as the postgres user, AFTER
-- 20261115120000_employer_placements.sql (the file stops at once if it is
-- missing). No auth user is created; accounts are impersonated with
-- `set local role` + request.jwt.claims; pg_temp helpers are only called as
-- postgres.
--
-- Employer A = the TEST İşveren account below. Employer B = another employer
-- record; one with a verified login is preferred, so scenario 12 can run as
-- B. B's own real rows are never printed, only membership of the test rows.
-- Without such a B, scenario 12 is KALDI ("test yapılamadı").
--
-- Output: one NOTICE per check; the last statement before the rollback
-- returns the result table (_results). Each check is GEÇTİ or KALDI.
-- Test rows have is_demo = true and a "TEST yerleştirme" title.

begin;

-- 0. Settings ------------------------------------------------------------------

create temp table _ctx (k text primary key, v text) on commit drop;
create temp table _results (id serial, n text, senaryo text, sonuc text, ayrinti text) on commit drop;

insert into _ctx (k, v) values
  ('email_employer', 'huseyinaksu+isveren2@gmail.com');  -- TEST İşveren (employer A)

create function pg_temp.ctx(p_k text) returns text language sql as $$ select v from _ctx where k = p_k $$;
create function pg_temp.uid(p_k text) returns uuid language sql as $$ select nullif(v, '')::uuid from _ctx where k = p_k $$;
create function pg_temp.put(p_k text, p_v text) returns void language sql as $$
  insert into _ctx (k, v) values (p_k, p_v) on conflict (k) do update set v = excluded.v
$$;
create function pg_temp.rec(p_n text, p_senaryo text, p_ok boolean, p_detail text) returns void language plpgsql as $$
declare
  v_sonuc text := case when p_ok then 'GEÇTİ' else 'KALDI' end;
  v_detail text := case when p_ok is null then 'test yapılamadı: ' || coalesce(p_detail, '') else p_detail end;
begin
  insert into _results (n, senaryo, sonuc, ayrinti) values (p_n, p_senaryo, v_sonuc, v_detail);
  raise notice '[%] % | % | %', p_n, v_sonuc, p_senaryo, coalesce(v_detail, '');
end;
$$;

-- 1. Accounts and test data (as postgres) --------------------------------------

do $$
declare
  v_uid_a uuid;
  v_emp_a uuid; v_name_a text; v_country text;
  v_emp_b uuid; v_name_b text; v_uid_b uuid; v_check uuid;
  v_missing text;
  v_run text := substr(md5(clock_timestamp()::text || random()::text), 1, 8);
  v_c uuid[] := '{}';
  v_r1 uuid; v_rb uuid;
  v_id uuid;
begin
  if to_regprocedure('public.employer_placements()') is null then
    raise exception 'employer_placements() yok: önce 20261115120000_employer_placements.sql uygulanmalı.';
  end if;
  if to_regprocedure('public.employer_decide_match(uuid, text)') is null then
    raise exception 'employer_decide_match(uuid, text) yok: 20261112120000_employer_match_decision.sql gerekli.';
  end if;
  if to_regprocedure('public.request_pipeline_counts_for_me()') is null then
    raise exception 'request_pipeline_counts_for_me() yok: 20261113120000_request_pipeline_counts.sql gerekli.';
  end if;
  -- Scenario 13 archives c8; the column is not in the repo's create table.
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'job_candidates' and column_name = 'archived_at') then
    raise exception 'job_candidates.archived_at sütunu yok: senaryo 13 kurulamıyor.';
  end if;
  perform pg_temp.put('run', v_run);

  -- Employer A from auth.users by e-mail. No user is created.
  select u.id into v_uid_a from auth.users u where lower(u.email) = lower(btrim(pg_temp.ctx('email_employer')));
  if v_uid_a is null then
    raise exception 'auth.users içinde bulunamadı: %. Betik yeni kullanıcı oluşturmaz.', pg_temp.ctx('email_employer');
  end if;
  perform pg_temp.put('uid_a', v_uid_a::text);

  perform set_config('request.jwt.claims', json_build_object('sub', v_uid_a, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_uid_a::text, true);
  v_emp_a := public.my_employer_id();
  if not public.email_access_ok() then
    raise notice 'UYARI: TEST İşveren hesabının e-posta doğrulaması yok (email_access_ok = false); 1-9 KALDI olur.';
  end if;
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  if v_emp_a is null then
    raise exception 'TEST İşveren hesabı bir işveren kaydına bağlı değil (my_employer_id boş).';
  end if;
  select e.company_name, e.country into v_name_a, v_country from public.employers e where e.id = v_emp_a;
  perform pg_temp.put('emp_a', v_emp_a::text);

  -- Employer B: another employer, preferably with a verified login.
  select e.id, e.company_name, acct.uid into v_emp_b, v_name_b, v_uid_b
  from public.employers e
  left join lateral (
    select u.uid
    from (
      select p.id as uid from public.profiles p
      where p.linked_employer_id = e.id and p.role = 'employer'
      union all
      select e.auth_user_id where e.auth_user_id is not null
    ) u
    where exists (select 1 from public.account_email_proof x where x.user_id = u.uid)
       or exists (select 1 from auth.identities i where i.user_id = u.uid and i.provider = 'google')
    limit 1
  ) acct on true
  where e.id <> v_emp_a
  order by (acct.uid is not null) desc, e.is_demo desc nulls last
  limit 1;
  if v_emp_b is null then
    raise exception 'İkinci bir işveren kaydı yok; senaryo 3 ve 12 kurulamıyor.';
  end if;
  -- The account must really resolve to B.
  if v_uid_b is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid_b, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_b::text, true);
    v_check := public.my_employer_id();
    if v_check is distinct from v_emp_b or not public.email_access_ok() then
      v_uid_b := null;
    end if;
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
  end if;
  perform pg_temp.put('emp_b', v_emp_b::text);
  perform pg_temp.put('uid_b', coalesce(v_uid_b::text, ''));
  raise notice 'İşveren B: % (giriş hesabı ile test: %).', v_name_b, (v_uid_b is not null);

  v_country := coalesce(nullif(v_country, ''),
                        (select r.country from public.job_requests r where r.employer_id = v_emp_a and r.country is not null limit 1),
                        'Belirtilmedi');

  -- Every NOT NULL column without a default must be in that table's insert
  -- column list below. A missing column stops the script here, by name.
  select string_agg(t.tbl || '.' || col.column_name, ', ' order by t.tbl, col.column_name) into v_missing
  from (values
    ('job_candidates',      array['full_name', 'nationality', 'phone', 'email', 'profession',
                                  'sector', 'passport_number', 'status', 'is_demo']),
    ('job_requests',        array['employer_id', 'employer_name', 'sector', 'position_title', 'headcount',
                                  'monthly_net_salary', 'accommodation_provided', 'food_provided',
                                  'status', 'country', 'is_demo']),
    ('request_matches',     array['request_id', 'candidate_id', 'bound_at', 'presented_at', 'is_demo']),
    ('job_offers',          array['candidate_id', 'employer_id', 'request_id', 'employer_name', 'position_title',
                                  'monthly_net_salary', 'start_date', 'terms_details', 'status', 'is_demo']),
    ('placement_followups', array['candidate_id', 'employer_id', 'request_id', 'employer_name', 'period_stage',
                                  'check_date', 'compliance_score', 'salary_compliance',
                                  'accommodation_compliance', 'employer_feedback', 'employee_feedback',
                                  'notes', 'is_demo'])
  ) as t(tbl, covered)
  join information_schema.columns col
    on col.table_schema = 'public' and col.table_name = t.tbl
  where col.is_nullable = 'NO' and col.column_default is null
    and col.is_identity = 'NO' and col.is_generated = 'NEVER'
    and col.column_name <> all (t.covered);
  if v_missing is not null then
    raise exception 'Zorunlu, varsayılansız sütun betiğin insert''lerinde yok: %. Betiği bu sütunlarla güncelleyin.', v_missing;
  end if;

  -- Eight candidates of our own. phone 'p-plc-...' gives phone_key null and
  -- the passport is unique per run, so the unique indexes cannot collide.
  for i in 1..8 loop
    insert into public.job_candidates (full_name, nationality, phone, email, profession, sector,
                                       passport_number, status, is_demo)
    values ('TEST yerleştirme aday ' || i, 'Belirtilmedi', 'p-plc-' || v_run || '-' || i,
            'test-plc-' || v_run || '-' || i || '@example.invalid', 'Belirtilmedi', 'construction',
            'TPLC' || upper(v_run) || i, 'pending', true)
    returning id into v_id;
    v_c := array_append(v_c, v_id);
    perform pg_temp.put('c' || i, v_id::text);
  end loop;

  -- R1: employer A, c1..c6 and c8 presented. RB: employer B, c7 presented.
  insert into public.job_requests (employer_id, employer_name, sector, position_title, headcount,
                                   monthly_net_salary, accommodation_provided, food_provided, status, country, is_demo)
  values (v_emp_a, v_name_a, 'construction', 'TEST yerleştirme R1', 5, 1000, true, true, 'searching_candidates', v_country, true)
  returning id into v_r1;
  insert into public.job_requests (employer_id, employer_name, sector, position_title, headcount,
                                   monthly_net_salary, accommodation_provided, food_provided, status, country, is_demo)
  values (v_emp_b, v_name_b, 'construction', 'TEST yerleştirme RB', 1, 1000, true, true, 'searching_candidates', v_country, true)
  returning id into v_rb;
  perform pg_temp.put('r1', v_r1::text);
  perform pg_temp.put('rb', v_rb::text);

  for i in 1..6 loop
    insert into public.request_matches (request_id, candidate_id, bound_at, presented_at, is_demo)
    values (v_r1, v_c[i], now(), now(), true)
    returning id into v_id;
    perform pg_temp.put('m' || i, v_id::text);
  end loop;
  insert into public.request_matches (request_id, candidate_id, bound_at, presented_at, is_demo)
  values (v_rb, v_c[7], now(), now(), true)
  returning id into v_id;
  perform pg_temp.put('m7', v_id::text);
  insert into public.request_matches (request_id, candidate_id, bound_at, presented_at, is_demo)
  values (v_r1, v_c[8], now(), now(), true)
  returning id into v_id;
  perform pg_temp.put('m8', v_id::text);

  -- Process and travel records. Every candidate gets a PNR and an
  -- accommodation text that must never reach the employer.
  update public.job_candidates c
  set pnr_code = 'TPNR' || upper(v_run) || x.i,
      accommodation_details = 'TEST-KONAKLAMA-' || v_run || '-' || x.i
  from unnest(v_c) with ordinality as x(id, i)
  where c.id = x.id;

  update public.job_candidates set official_process_status = 'visa_applied', travel_status = 'planned',
         active_request_id = null
   where id = v_c[1];
  update public.job_candidates set official_process_status = 'ready_to_travel', travel_status = 'ticketed',
         flight_date = '2026-11-28 14:30', flight_number = 'TK1083',
         departure_city = 'İstanbul', arrival_city = 'Belgrad', active_request_id = v_r1
   where id = v_c[2];
  update public.job_candidates set official_process_status = 'started_work', travel_status = 'completed',
         active_request_id = v_r1
   where id = v_c[3];
  update public.job_candidates set official_process_status = 'visa_applied', active_request_id = v_r1
   where id = any (array[v_c[4], v_c[5], v_c[6]]);
  update public.job_candidates set official_process_status = 'ready_to_travel', travel_status = 'ticketed',
         active_request_id = v_rb
   where id = v_c[7];
  -- c8: in process on R1, then archived.
  update public.job_candidates set official_process_status = 'documents_collecting', active_request_id = v_r1
   where id = v_c[8];
  update public.job_candidates set archived_at = now() where id = v_c[8];

  -- Offers: c1 pending only, c2 and c3 accepted.
  insert into public.job_offers (candidate_id, employer_id, request_id, employer_name, position_title,
                                 monthly_net_salary, start_date, terms_details, status, is_demo)
  values (v_c[1], v_emp_a, v_r1, v_name_a, 'TEST yerleştirme R1', 1000, '2026-12-24', 'TEST', 'pending', true),
         (v_c[2], v_emp_a, v_r1, v_name_a, 'TEST yerleştirme R1', 1000, '2026-12-01', 'TEST', 'accepted', true),
         (v_c[3], v_emp_a, v_r1, v_name_a, 'TEST yerleştirme R1', 1000, '2026-11-20', 'TEST', 'accepted', true);

  -- Follow-ups for c3: 30 (assessed) and 60 (planned) on R1, and one row
  -- of employer B / RB that A must not see.
  insert into public.placement_followups (candidate_id, employer_id, request_id, employer_name, period_stage,
                                          check_date, compliance_score, salary_compliance,
                                          accommodation_compliance, employer_feedback, employee_feedback,
                                          notes, is_demo)
  values (v_c[3], v_emp_a, v_r1, v_name_a, '30', '2026-12-20', 4, true, true,
          'TEST-ISV-GERI-' || v_run, 'TEST-CAL-GERI-' || v_run, 'TEST-NOT-' || v_run, true),
         (v_c[3], v_emp_a, v_r1, v_name_a, '60', '2027-01-19', null, null, null,
          null, null, 'TEST-NOT2-' || v_run, true),
         (v_c[3], v_emp_b, v_rb, v_name_b, '90', '2027-02-18', null, null, null,
          null, null, 'TEST-NOT3-' || v_run, true);

  raise notice 'Test verisi hazır: R1=%, RB=% (hepsi rollback ile silinecek).', v_r1, v_rb;
end $$;

-- 2. Employer B's selection (as postgres, test data) ----------------------------
-- B may have no login, so its decision is set with the RPC flag the
-- decision RPCs use. Only test data; what is under test is A's view.

do $$
begin
  perform set_config('panova.match_decision_rpc', 'on', true);
  update public.request_matches
  set employer_decision = 'selected', decision_source = 'staff',
      decision_reason = 'TEST yerleştirme senaryosu', decided_at = now()
  where id = pg_temp.uid('m7');
  perform set_config('panova.match_decision_rpc', 'off', true);
end $$;

-- 3. Scenario 0 and 5: employer A decides through its RPC -----------------------

do $$
declare
  v_uid uuid := pg_temp.uid('uid_a');
  v_m1 uuid := pg_temp.uid('m1'); v_m2 uuid := pg_temp.uid('m2'); v_m3 uuid := pg_temp.uid('m3');
  v_m5 uuid := pg_temp.uid('m5'); v_m6 uuid := pg_temp.uid('m6'); v_m8 uuid := pg_temp.uid('m8');
  v_seen5 boolean; v_err text; v_dec text;
begin
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid::text, true);
    set local role authenticated;
    perform public.employer_decide_match(v_m1, 'selected');
    perform public.employer_decide_match(v_m2, 'selected');
    perform public.employer_decide_match(v_m3, 'selected');
    perform public.employer_decide_match(v_m5, 'selected');
    perform public.employer_decide_match(v_m6, 'rejected');
    perform public.employer_decide_match(v_m8, 'selected');
    select exists (select 1 from public.employer_placements() p where p.match_id = v_m5) into v_seen5;
    perform public.employer_decide_match(v_m5, 'pending');
    reset role;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);

  select string_agg(m.employer_decision, ',' order by x.i) into v_dec
  from unnest(array[v_m1, v_m2, v_m3, pg_temp.uid('m4'), v_m5, v_m6, pg_temp.uid('m7'), v_m8]) with ordinality as x(id, i)
  join public.request_matches m on m.id = x.id;
  perform pg_temp.put('seen5', coalesce(v_seen5::text, ''));

  perform pg_temp.rec('0', 'Kurulum: işveren A kararları kendi RPC''si ile girildi',
    v_err is null and v_dec = 'selected,selected,selected,pending,pending,rejected,selected,selected',
    format('kararlar(m1..m8)=%s hata=%s', v_dec, coalesce(v_err, '-')));
end $$;

-- 4. Employer A's view: one call, analysed as postgres --------------------------

do $$
declare
  v_uid uuid := pg_temp.uid('uid_a');
  v_r1 uuid := pg_temp.uid('r1');
  v_rows jsonb; v_cards jsonb; v_err text;
begin
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid::text, true);
    set local role authenticated;
    select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) into v_rows from public.employer_placements() p;
    -- The employer cards for R1, same user, same transaction state.
    select to_jsonb(k) into v_cards from public.request_pipeline_counts_for_me() k where k.request_id = v_r1;
    reset role;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform pg_temp.put('rows_a', coalesce(v_rows::text, ''));
  perform pg_temp.put('cards_r1', coalesce(v_cards::text, ''));
  perform pg_temp.put('rows_a_err', coalesce(v_err, ''));
end $$;

do $$
declare
  v_rows jsonb := nullif(pg_temp.ctx('rows_a'), '')::jsonb;
  v_err text := nullif(pg_temp.ctx('rows_a_err'), '');
  v_run text := pg_temp.ctx('run');
  v_r1 uuid := pg_temp.uid('r1');
  v_rb uuid := pg_temp.uid('rb');
  v_c uuid[] := array[pg_temp.uid('c1'), pg_temp.uid('c2'), pg_temp.uid('c3'), pg_temp.uid('c4'),
                      pg_temp.uid('c5'), pg_temp.uid('c6'), pg_temp.uid('c7'), pg_temp.uid('c8')];
  v_cards jsonb := nullif(pg_temp.ctx('cards_r1'), '')::jsonb;
  v_test jsonb; v_n int; v_ok boolean; v_txt text;
  v1 jsonb; v2 jsonb; v3 jsonb; v8 jsonb;
  v_l_rows int; v_l_in int; v_l_tr int; v_l_st int;
  v_keys text; v_fkeys text; v_leaks text; v_secrets text[];
begin
  if v_rows is null then
    perform pg_temp.rec('1', 'İşveren A kendi seçtiği adayları görür', false, 'çağrı hatası: ' || coalesce(v_err, '-'));
    return;
  end if;

  -- Only the rows of this run's test candidates (A may have other real rows).
  select coalesce(jsonb_agg(r), '[]'::jsonb) into v_test
  from jsonb_array_elements(v_rows) r
  where (r ->> 'candidate_id')::uuid = any (v_c);
  select r into v1 from jsonb_array_elements(v_test) r where (r ->> 'candidate_id')::uuid = v_c[1];
  select r into v2 from jsonb_array_elements(v_test) r where (r ->> 'candidate_id')::uuid = v_c[2];
  select r into v3 from jsonb_array_elements(v_test) r where (r ->> 'candidate_id')::uuid = v_c[3];
  select r into v8 from jsonb_array_elements(v_test) r where (r ->> 'candidate_id')::uuid = v_c[8];

  -- 1
  v_n := jsonb_array_length(v_test);
  v_ok := v_n = 4 and v1 is not null and v2 is not null and v3 is not null and v8 is not null
          and not exists (select 1 from jsonb_array_elements(v_test) r where (r ->> 'request_id')::uuid is distinct from v_r1);
  perform pg_temp.rec('1', 'İşveren A kendi seçtiği adayları görür (c1, c2, c3, arşivli c8; tek satır, talep R1)',
    v_ok, format('test_satırı=%s c1=%s c2=%s c3=%s c8=%s', v_n, v1 is not null, v2 is not null, v3 is not null, v8 is not null));

  -- 2
  perform pg_temp.rec('2', 'Aşama candidate_pipeline_stage ile: c1 in_process, c2 travel_ready, c3 started, c8 in_process',
    v1 ->> 'pipeline_stage' = 'in_process' and v2 ->> 'pipeline_stage' = 'travel_ready'
      and v3 ->> 'pipeline_stage' = 'started' and v8 ->> 'pipeline_stage' = 'in_process'
      and v1 ->> 'official_process_status' = 'visa_applied'
      and v3 ->> 'official_process_status' = 'started_work',
    format('c1=%s/%s c2=%s/%s c3=%s/%s c8=%s/%s',
      v1 ->> 'pipeline_stage', v1 ->> 'official_process_status',
      v2 ->> 'pipeline_stage', v2 ->> 'official_process_status',
      v3 ->> 'pipeline_stage', v3 ->> 'official_process_status',
      v8 ->> 'pipeline_stage', v8 ->> 'official_process_status'));

  -- 3
  select count(*) into v_n from jsonb_array_elements(v_rows) r
  where (r ->> 'candidate_id')::uuid = v_c[7] or (r ->> 'request_id')::uuid = v_rb;
  perform pg_temp.rec('3', 'İşveren A, işveren B''nin seçtiği adayı (c7) görmez', v_n = 0,
    format('B_satırı=%s', v_n));

  -- 4
  select count(*) into v_n from jsonb_array_elements(v_rows) r
  where (r ->> 'candidate_id')::uuid in (v_c[4], v_c[6]);
  perform pg_temp.rec('4', 'Seçilmemiş (c4, bekliyor) ve reddedilmiş (c6) aday çıkmaz', v_n = 0,
    format('görünen=%s', v_n));

  -- 5
  select count(*) into v_n from jsonb_array_elements(v_rows) r where (r ->> 'candidate_id')::uuid = v_c[5];
  perform pg_temp.rec('5', 'Seçimi geri alınan aday (c5) düşer; seçiliyken görünüyordu',
    pg_temp.ctx('seen5') = 'true' and v_n = 0,
    format('seçiliyken_görünür=%s geri_alınca_satır=%s', coalesce(nullif(pg_temp.ctx('seen5'), ''), '-'), v_n));

  -- 6
  perform pg_temp.rec('6', 'İşe başlama = kabul edilmiş teklifin start_date alanı, yoksa boş',
    left(v2 ->> 'start_date', 10) = '2026-12-01' and left(v3 ->> 'start_date', 10) = '2026-11-20'
      and v1 ->> 'start_date' is null,
    format('c1=%s c2=%s c3=%s', coalesce(v1 ->> 'start_date', 'null'), v2 ->> 'start_date', v3 ->> 'start_date'));

  -- 7
  perform pg_temp.rec('7', 'flight_date serbest metin olarak döner, uçuş alanlarıyla',
    v2 ->> 'flight_date' = '2026-11-28 14:30' and v2 ->> 'flight_number' = 'TK1083'
      and v2 ->> 'departure_city' = 'İstanbul' and v2 ->> 'arrival_city' = 'Belgrad'
      and v2 ->> 'travel_status' = 'ticketed',
    format('flight_date=%s flight_number=%s rota=%s→%s seyahat=%s',
      v2 ->> 'flight_date', v2 ->> 'flight_number', v2 ->> 'departure_city', v2 ->> 'arrival_city', v2 ->> 'travel_status'));

  -- 8
  select string_agg(distinct k, ',' order by k) into v_fkeys
  from jsonb_array_elements(v_rows) r, jsonb_array_elements(r -> 'followups') f, jsonb_object_keys(f) k;
  select string_agg((f ->> 'period_stage') || ':' || (f ->> 'status') || ':' || coalesce(left(f ->> 'check_date', 10), '-'),
                    ',' order by f ->> 'period_stage') into v_txt
  from jsonb_array_elements(v3 -> 'followups') f;
  perform pg_temp.rec('8', '30/60/90: yalnız bu talebin dönemleri; öğe yalnız dönem, tarih, durum',
    v_txt = '30:completed:2026-12-20,60:planned:2027-01-19'
      and v_fkeys = 'check_date,period_stage,status'
      and jsonb_array_length(v1 -> 'followups') = 0 and jsonb_array_length(v2 -> 'followups') = 0,
    format('c3=%s öğe_anahtarları=%s c1_adet=%s c2_adet=%s',
      coalesce(v_txt, '-'), coalesce(v_fkeys, '-'),
      jsonb_array_length(v1 -> 'followups'), jsonb_array_length(v2 -> 'followups')));

  -- 9a: keys
  select string_agg(distinct k, ',' order by k) into v_keys
  from jsonb_array_elements(v_rows) r, jsonb_object_keys(r) k
  where k ~* '(passport|phone|email|birth|address|document|notes|referral|pnr|accommodation|salary|compliance|feedback|auth_user|reason)';
  -- 9b: values of this run's test candidates anywhere in the result
  select array_agg(s) into v_secrets from (
    select 'TPLC' || upper(v_run) || i as s from generate_series(1, 8) i
    union all select 'p-plc-' || v_run || '-' || i from generate_series(1, 8) i
    union all select 'test-plc-' || v_run || '-' || i from generate_series(1, 8) i
    union all select 'TPNR' || upper(v_run) || i from generate_series(1, 8) i
    union all select 'TEST-KONAKLAMA-' || v_run || '-' || i from generate_series(1, 8) i
    union all select unnest(array['TEST-ISV-GERI-' || v_run, 'TEST-CAL-GERI-' || v_run,
                                  'TEST-NOT-' || v_run, 'TEST-NOT2-' || v_run, 'TEST-NOT3-' || v_run])
  ) x;
  select string_agg(s, ', ') into v_leaks from unnest(v_secrets) s where position(lower(s) in lower(v_rows::text)) > 0;
  perform pg_temp.rec('9', 'Pasaport, telefon, e-posta, PNR, konaklama, geri bildirim, not: sonuçta ne anahtar ne değer',
    v_keys is null and v_leaks is null,
    format('yasak_anahtar=%s sızan_değer=%s aranan_değer=%s',
      coalesce(v_keys, 'yok'), coalesce(v_leaks, 'yok'), coalesce(array_length(v_secrets, 1), 0)));

  -- 13: list rows of R1 against the cards of R1 (all rows of R1, not only
  -- this run's: R1 is a test request, so they are the same).
  select count(*),
         count(*) filter (where r ->> 'pipeline_stage' = 'in_process'),
         count(*) filter (where r ->> 'pipeline_stage' = 'travel_ready'),
         count(*) filter (where r ->> 'pipeline_stage' = 'started')
    into v_l_rows, v_l_in, v_l_tr, v_l_st
  from jsonb_array_elements(v_rows) r
  where (r ->> 'request_id')::uuid = v_r1;
  perform pg_temp.rec('13', 'Liste ve kart aynı: satır = seçilmiş, aşama sayıları eşit; arşivli c8 ikisinde de var',
    v_cards is not null
      and v_l_rows = (v_cards ->> 'selected')::int
      and v_l_in = (v_cards ->> 'in_process')::int
      and v_l_tr = (v_cards ->> 'travel_ready')::int
      and v_l_st = (v_cards ->> 'started')::int
      and v_l_rows = 4 and v_l_in = 2 and v_l_tr = 1 and v_l_st = 1
      and v8 is not null,
    format('liste: satır=%s işlemde=%s seyahat_hazır=%s başladı=%s | kart: seçilmiş=%s işlemde=%s seyahat_hazır=%s başladı=%s | c8_listede=%s',
      v_l_rows, v_l_in, v_l_tr, v_l_st,
      coalesce(v_cards ->> 'selected', '-'), coalesce(v_cards ->> 'in_process', '-'),
      coalesce(v_cards ->> 'travel_ready', '-'), coalesce(v_cards ->> 'started', '-'),
      v8 is not null));
end $$;

-- 5. Scenario 10: anon ---------------------------------------------------------

do $$
declare
  v_err text;
  v_priv boolean := has_function_privilege('anon', 'public.employer_placements()'::regprocedure, 'execute');
begin
  begin
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    perform set_config('request.jwt.claim.sub', '', true);
    set local role anon;
    perform * from public.employer_placements();
    reset role;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  perform pg_temp.rec('10', 'Anon employer_placements() çağıramaz',
    not v_priv and coalesce(v_err, '') ilike '%permission denied%',
    format('anon_execute_yetkisi=%s hata=%s', v_priv, coalesce(v_err, 'HATA YOK (çağrı kabul edildi)')));
end $$;

-- 6. Scenario 11: not an employer; employer without e-mail proof ---------------

do $$
declare
  v_uid_a uuid := pg_temp.uid('uid_a');
  v_stranger uuid := gen_random_uuid();
  v_n int; v_n_noproof int; v_err text; v_err2 text;
  v_google boolean;
  v_had_proof boolean;
begin
  -- 11a: a signed-in user with no employer link.
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_stranger, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_stranger::text, true);
    set local role authenticated;
    select count(*) into v_n from public.employer_placements();
    reset role;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;
  perform pg_temp.rec('11a', 'İşveren olmayan oturum sıfır satır alır', v_err is null and v_n = 0,
    format('satır=%s hata=%s', coalesce(v_n::text, '-'), coalesce(v_err, '-')));

  -- 11b: employer A without e-mail proof. The proof row is removed inside a
  -- sub-block that always ends in an error, so the removal is undone.
  select exists (select 1 from auth.identities i where i.user_id = v_uid_a and i.provider = 'google') into v_google;
  select exists (select 1 from public.account_email_proof p where p.user_id = v_uid_a) into v_had_proof;
  if v_google then
    perform pg_temp.rec('11b', 'E-posta doğrulaması olmayan işveren sıfır satır alır', null,
      'TEST İşveren bir Google hesabı; doğrulama kaldırılamaz');
  else
    begin
      delete from public.account_email_proof where user_id = v_uid_a;
      perform set_config('request.jwt.claims', json_build_object('sub', v_uid_a, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_uid_a::text, true);
      set local role authenticated;
      select count(*) into v_n_noproof from public.employer_placements();
      reset role;
      raise exception 'panova_undo_proof';
    exception when others then
      if sqlerrm <> 'panova_undo_proof' then
        v_err2 := sqlerrm;
      end if;
    end;
    reset role;
    perform pg_temp.rec('11b', 'E-posta doğrulaması olmayan işveren sıfır satır alır',
      v_err2 is null and v_n_noproof = 0
        and (exists (select 1 from public.account_email_proof p where p.user_id = v_uid_a)) = v_had_proof,
      format('satır=%s hata=%s doğrulama_geri_geldi=%s', coalesce(v_n_noproof::text, '-'), coalesce(v_err2, '-'),
        (exists (select 1 from public.account_email_proof p where p.user_id = v_uid_a)) = v_had_proof));
  end if;
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
end $$;

-- 7. Scenario 12: employer B's own view ----------------------------------------

do $$
declare
  v_uid_b uuid := pg_temp.uid('uid_b');
  v_c7 uuid := pg_temp.uid('c7');
  v_a uuid[] := array[pg_temp.uid('c1'), pg_temp.uid('c2'), pg_temp.uid('c3'),
                      pg_temp.uid('c4'), pg_temp.uid('c5'), pg_temp.uid('c6'), pg_temp.uid('c8')];
  v_r1 uuid := pg_temp.uid('r1');
  v_has7 boolean; v_n_a int; v_err text;
begin
  if v_uid_b is null then
    perform pg_temp.rec('12', 'İşveren B kendi adayını (c7) görür, A''nın adaylarını görmez', null,
      'doğrulanmış giriş hesabı olan ikinci bir işveren yok');
    return;
  end if;
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid_b, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_b::text, true);
    set local role authenticated;
    select coalesce(bool_or(p.candidate_id = v_c7), false),
           count(*) filter (where p.candidate_id = any (v_a) or p.request_id = v_r1)
      into v_has7, v_n_a
    from public.employer_placements() p;
    reset role;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  perform pg_temp.rec('12', 'İşveren B kendi adayını (c7) görür, A''nın adaylarını görmez',
    v_err is null and v_has7 and v_n_a = 0,
    format('c7_görünür=%s A_satırı=%s hata=%s', v_has7, v_n_a, coalesce(v_err, '-')));
end $$;

-- 8. Result --------------------------------------------------------------------

do $$
begin
  raise notice 'Sonuç: % / % GEÇTİ.',
    (select count(*) from _results where sonuc = 'GEÇTİ'), (select count(*) from _results);
end $$;

select n, senaryo, sonuc, ayrinti from _results order by id;

rollback;
