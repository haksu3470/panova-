-- Scenario test for automatic request status (A: 20261114120000), the
-- manual override (B: 20261114130000) and the pipeline stage rule
-- (C: 20261114140000, travel_status 'planned' is neutral).
--
--   1  match -> searching, presentation -> presenting, interview -> interviews
--   2  selected = headcount -> selection_completed; selected < headcount -> not;
--      h3: a candidate file saved with travel 'planned' moves nothing
--   3  process record -> official_process; ticket (ticketed) -> travel_planning
--   4  undoing a selection does not move back; a cancelled request does not
--      advance; "completed" is never set automatically
--   5  Kaynak, Hedef and Saha cannot change the status by hand (RPC refused,
--      direct update refused); Üst Yönetim cannot without a reason, nor by a
--      direct update; with a reason it can, and the audit row says so
--   6  anon cannot call the functions; an employer cannot call
--      advance_request_status directly
--   k  the facts behind the status (request_status_facts) equal what the
--      employer sees on the cards (request_pipeline_counts_for_me):
--      presented, selected, interviews, in process, travel-ready, started,
--      and both equal the expected values (k1 after 3a, k2 after 4c)
--
-- Steps 1-4 use the app's own paths: Kaynak Ülke matches and presents,
-- Hedef Ülke plans the interview and enters process / travel records, the
-- employer selects (employer_decide_match). Only test data is inserted as
-- postgres; nothing under test is.
--
-- Compatible with employer_match_scenario.sql 6a-6c (same rule: selection
-- completed at headcount, never backward, cancelled untouched). Both files
-- can be run one after the other; each ends in rollback.
--
-- NOTHING IS KEPT. The whole file runs between `begin;` and `rollback;`.
-- There is no commit statement in this file.
--
-- Run it in the Supabase SQL Editor (or psql) as the postgres user, AFTER A
-- and C (the file stops at once if either is missing).
-- Without B, scenario 5 is KALDI ("test yapılamadı"); everything else runs.
-- Same accounts and method as employer_match_scenario.sql: no auth user is
-- created; accounts are impersonated with `set local role` +
-- request.jwt.claims; pg_temp helpers are only called as postgres.
--
-- Output: one NOTICE per check; the last statement before the rollback
-- returns the result table (_results). Each check is GEÇTİ or KALDI.
-- Test rows have is_demo = true and a "TEST durum" title.

begin;

-- 0. Settings ------------------------------------------------------------------

create temp table _ctx (k text primary key, v text) on commit drop;
create temp table _results (id serial, n text, senaryo text, sonuc text, ayrinti text) on commit drop;

insert into _ctx (k, v) values
  ('email_employer', 'huseyinaksu+isveren2@gmail.com'),  -- TEST İşveren
  ('email_source',   'huseyinaksu+kaynak@gmail.com'),    -- Test Kaynak Ülke
  ('email_target',   'huseyinaksu+hedef@gmail.com'),     -- Test Hedef Ülke
  ('email_field',    'huseyinaksu+saha@gmail.com'),      -- Test Saha
  ('email_upper',    'huseyinaksu@gmail.com');           -- Üst Yönetim

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

-- 1. Users, roles and test data (as postgres) ---------------------------------

do $$
declare
  r record;
  v_key text;
  v_uid uuid;
  v_role text; v_scope text; v_code text; v_nat text;
  v_expected jsonb := '{"source":"source_country","target":"target_country","field":"field_officer","upper":"upper_management"}';
  v_emp_a uuid; v_name_a text; v_country text;
  v_missing text;
  v_run text := substr(md5(clock_timestamp()::text || random()::text), 1, 8);
  v_c uuid[] := '{}';
  v_id uuid;
begin
  -- Part A must be in place.
  if to_regprocedure('public.advance_request_status(uuid)') is null
     or not exists (select 1 from pg_trigger
                    where tgrelid = 'public.request_matches'::regclass and tgname = 'request_matches_advance_status') then
    raise exception 'Bölüm A uygulanmamış: önce 20261114120000_request_status_auto.sql.';
  end if;
  -- Without C, travel_status 'planned' (the column default) counts as travel
  -- ready and steps 2a-4c give misleading results.
  if to_regprocedure('public.candidate_pipeline_stage(text, text)') is null then
    raise exception 'Bölüm C uygulanmamış: önce 20261114140000_pipeline_stage_travel_ready.sql.';
  end if;
  perform pg_temp.put('has_manual', (to_regprocedure('public.staff_set_request_status(uuid, text, text)') is not null)::text);

  for r in select k, v from _ctx where k like 'email\_%' loop
    v_uid := null;
    select u.id into v_uid from auth.users u where lower(u.email) = lower(btrim(r.v));
    if v_uid is null then
      raise exception 'auth.users içinde bulunamadı: % (%). Betik yeni kullanıcı oluşturmaz.', r.v, r.k;
    end if;
    perform pg_temp.put('uid_' || substr(r.k, 7), v_uid::text);
  end loop;

  foreach v_key in array array['source', 'target', 'field', 'upper'] loop
    perform set_config('request.jwt.claims', json_build_object('sub', pg_temp.uid('uid_' || v_key), 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', pg_temp.uid('uid_' || v_key)::text, true);
    v_role := null; v_scope := null; v_code := null;
    select lower(me.role_level), me.scope_country, me.referral_code into v_role, v_scope, v_code
    from public.current_staff() me limit 1;
    perform pg_temp.put('role_' || v_key, coalesce(v_role, ''));
    perform pg_temp.put('scope_' || v_key, coalesce(v_scope, ''));
    perform pg_temp.put('code_' || v_key, coalesce(v_code, ''));
    if coalesce(v_role, '') <> v_expected ->> v_key then
      raise notice 'UYARI: % hesabının rolü "%" (beklenen "%"). İlgili senaryo KALDI olur.',
        v_key, coalesce(v_role, 'personel kaydı yok / e-posta doğrulanmamış'), v_expected ->> v_key;
    else
      raise notice 'Hesap %: rol=%, kapsam ülkesi=%', v_key, v_role, coalesce(nullif(v_scope, ''), '-');
    end if;
  end loop;

  perform set_config('request.jwt.claims', json_build_object('sub', pg_temp.uid('uid_employer'), 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', pg_temp.uid('uid_employer')::text, true);
  v_emp_a := public.my_employer_id();
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  if v_emp_a is null then
    raise exception 'TEST İşveren hesabı bir işveren kaydına bağlı değil (my_employer_id boş).';
  end if;
  select e.company_name, e.country into v_name_a, v_country from public.employers e where e.id = v_emp_a;
  -- In the target officer's scope, so Hedef Ülke reaches the requests and
  -- only the status rule can stop it in scenario 5.
  v_country := coalesce(nullif(pg_temp.ctx('scope_target'), ''), v_country);
  -- Candidates carry the source officer's referral code and scope
  -- nationality, so Kaynak Ülke reaches them (matching is their screen).
  -- Hedef Ülke reaches them once they are matched to a request in its scope.
  v_nat := coalesce(nullif(pg_temp.ctx('scope_source'), ''), 'Belirtilmedi');

  select string_agg(t.tbl || '.' || col.column_name, ', ' order by t.tbl, col.column_name) into v_missing
  from (values
    ('job_candidates',  array['full_name', 'nationality', 'phone', 'email', 'profession',
                              'sector', 'passport_number', 'status', 'is_demo', 'referral_code']),
    ('job_requests',    array['employer_id', 'employer_name', 'sector', 'position_title', 'headcount',
                              'monthly_net_salary', 'accommodation_provided', 'food_provided',
                              'status', 'country', 'is_demo']),
    ('request_matches', array['request_id', 'candidate_id', 'bound_at', 'presented_at', 'is_demo']),
    ('interviews',      array['request_id', 'candidate_id', 'employer_id', 'scheduled_at', 'status', 'is_demo'])
  ) as t(tbl, covered)
  join information_schema.columns col
    on col.table_schema = 'public' and col.table_name = t.tbl
  where col.is_nullable = 'NO' and col.column_default is null
    and col.is_identity = 'NO' and col.is_generated = 'NEVER'
    and col.column_name <> all (t.covered);
  if v_missing is not null then
    raise exception 'Zorunlu, varsayılansız sütun betiğin insert''lerinde yok: %. Betiği bu sütunlarla güncelleyin.', v_missing;
  end if;

  -- Candidates are test data (inserted as postgres); every step under test
  -- below is done by the account that does it in the app.
  for i in 1..4 loop
    insert into public.job_candidates (full_name, nationality, phone, email, profession, sector,
                                       passport_number, status, is_demo, referral_code)
    values ('TEST durum aday ' || i, v_nat, 'p-dur-' || v_run || '-' || i,
            'test-durum-' || v_run || '-' || i || '@example.invalid', 'Belirtilmedi', 'construction',
            'TDUR' || upper(v_run) || i, 'pending', true, nullif(pg_temp.ctx('code_source'), ''))
    returning id into v_id;
    v_c := array_append(v_c, v_id);
    perform pg_temp.put('c' || i, v_id::text);
  end loop;

  -- RS: the request that walks through scenarios 1-4 (headcount 2).
  insert into public.job_requests (employer_id, employer_name, sector, position_title, headcount,
                                   monthly_net_salary, accommodation_provided, food_provided, status, country, is_demo)
  values (v_emp_a, v_name_a, 'construction', 'TEST durum RS', 2, 1000, true, true, 'new_request', v_country, true)
  returning id into v_id;
  perform pg_temp.put('rs', v_id::text);

  -- RC: cancelled request (scenario 4b).
  insert into public.job_requests (employer_id, employer_name, sector, position_title, headcount,
                                   monthly_net_salary, accommodation_provided, food_provided, status, country, is_demo)
  values (v_emp_a, v_name_a, 'construction', 'TEST durum RC', 1, 1000, true, true, 'cancelled', v_country, true)
  returning id into v_id;
  perform pg_temp.put('rc', v_id::text);

  -- RM: request for the manual change (scenario 5), presenting a candidate.
  insert into public.job_requests (employer_id, employer_name, sector, position_title, headcount,
                                   monthly_net_salary, accommodation_provided, food_provided, status, country, is_demo)
  values (v_emp_a, v_name_a, 'construction', 'TEST durum RM', 1, 1000, true, true, 'new_request', v_country, true)
  returning id into v_id;
  perform pg_temp.put('rm', v_id::text);
  perform pg_temp.put('emp_a', v_emp_a::text);
  -- Set-up for scenario 5 only (the manual change is what is tested there).
  insert into public.request_matches (request_id, candidate_id, bound_at, presented_at, is_demo)
  values (v_id, v_c[4], now(), now(), true);
  perform pg_temp.put('has_counts', (to_regprocedure('public.request_pipeline_counts_for_me()') is not null)::text);

  perform pg_temp.put('reason', 'TEST: işveren telefonda onay verdi');
  raise notice 'Test verisi hazır: RS=%, RC=%, RM=% (hepsi rollback ile silinecek).',
    pg_temp.ctx('rs'), pg_temp.ctx('rc'), pg_temp.ctx('rm');
end $$;

-- 2. Scenarios 1-4: automatic advance, through the app's own paths ----------
-- Every step under test runs as the account that does it in the app, with
-- request.jwt.claims + `set local role authenticated`, under RLS:
--   Kaynak Ülke  matches and presents     (MatchPanel: insert / presented_at)
--   Hedef Ülke   plans the interview and enters process / travel records
--                                         (InterviewOfferPanel, PlacementPanel)
--   İşveren      selects and undoes       (employer_decide_match)
-- No step uses postgres or upper management. Match ids are looked up as
-- postgres between steps ({m1} {m2} {m3}).

do $$
declare
  v_uid_source uuid := pg_temp.uid('uid_source');
  v_uid_target uuid := pg_temp.uid('uid_target');
  v_uid_emp uuid := pg_temp.uid('uid_employer');
  v_role_source text := pg_temp.ctx('role_source');
  v_role_target text := pg_temp.ctx('role_target');
  v_has_counts boolean := pg_temp.ctx('has_counts') = 'true';
  v_rs uuid := pg_temp.uid('rs');
  v_rc uuid := pg_temp.uid('rc');
  v_emp_a uuid := pg_temp.uid('emp_a');
  v_c1 uuid := pg_temp.uid('c1');
  v_c2 uuid := pg_temp.uid('c2');
  v_c3 uuid := pg_temp.uid('c3');
  -- n | actor | request | expected status | min rows | label | statement
  v_steps text[] := array[
    ['1a', 'source', 'rs', 'searching_candidates', '1',
     'Kaynak Ülke eşleştirince talep "aday aranıyor" olur',
     format('insert into public.request_matches (request_id, candidate_id, bound_at, is_demo) values (%L, %L, now(), true)', v_rs, v_c1)],
    ['1b', 'source', 'rs', 'presenting_candidates', '1',
     'Kaynak Ülke adayı sununca talep "adaylar sunuluyor" olur',
     format('update public.request_matches set presented_at = now() where request_id = %L and candidate_id = %L', v_rs, v_c1)],
    ['1c', 'target', 'rs', 'interviews', '1',
     'Hedef Ülke görüşme planlayınca talep "görüşmeler" olur',
     format('insert into public.interviews (request_id, candidate_id, employer_id, scheduled_at, status, is_demo) values (%L, %L, %L, now() + interval ''1 day'', ''scheduled'', true)', v_rs, v_c1, v_emp_a)],
    ['h1', 'source', 'rs', 'interviews', '1',
     'Hazırlık: Kaynak Ülke ikinci adayı eşleştirir (durum geri gitmez)',
     format('insert into public.request_matches (request_id, candidate_id, bound_at, is_demo) values (%L, %L, now(), true)', v_rs, v_c2)],
    ['h2', 'source', 'rs', 'interviews', '1',
     'Hazırlık: Kaynak Ülke ikinci adayı sunar',
     format('update public.request_matches set presented_at = now() where request_id = %L and candidate_id = %L', v_rs, v_c2)],
    ['2b', 'employer', 'rs', 'interviews', '1',
     'İşveren 1/2 seçer: talep "seçim tamamlandı" olmaz',
     'select public.employer_decide_match(''{m1}''::uuid, ''selected'')'],
    ['h3', 'target', 'rs', 'interviews', '1',
     'Hedef Ülke aday dosyasını kaydeder (travel_status ''planned''): ''planned'' nötr, talep "görüşmeler"de kalır',
     format('update public.job_candidates set travel_status = ''planned'', official_process_status = ''not_started'' where id = %L', v_c1)],
    ['2a', 'employer', 'rs', 'selection_completed', '1',
     'İşveren 2/2 seçer: talep "seçim tamamlandı" olur',
     'select public.employer_decide_match(''{m2}''::uuid, ''selected'')'],
    ['4a', 'employer', 'rs', 'selection_completed', '1',
     'İşveren seçimi geri alır: durum geri gitmez',
     'select public.employer_decide_match(''{m2}''::uuid, ''pending'')'],
    ['4a2', 'employer', 'rs', 'selection_completed', '1',
     'İşveren yeniden seçer: durum aynı kalır',
     'select public.employer_decide_match(''{m2}''::uuid, ''selected'')'],
    ['3a', 'target', 'rs', 'official_process', '1',
     'Hedef Ülke resmi süreç kaydı girer: talep "resmi süreç" olur',
     format('update public.job_candidates set official_process_status = ''documents_collecting'' where id = %L', v_c1)],
    ['3b', 'target', 'rs', 'travel_planning', '1',
     'Hedef Ülke bileti girer (ticketed = seyahat hazır): talep "seyahat planlama" olur',
     format('update public.job_candidates set travel_status = ''ticketed'' where id = %L', v_c1)],
    ['4c', 'target', 'rs', 'travel_planning', '2',
     'İki aday işe başlar: "tamamlandı" kendiliğinden verilmez',
     format('update public.job_candidates set official_process_status = ''started_work'', travel_status = ''completed'' where id in (%L, %L)', v_c1, v_c2)],
    ['4b1', 'source', 'rc', 'cancelled', '1',
     'Hazırlık: iptal edilmiş talepte Kaynak Ülke adayı eşleştirip sunar',
     format('insert into public.request_matches (request_id, candidate_id, bound_at, presented_at, is_demo) values (%L, %L, now(), now(), true)', v_rc, v_c3)],
    ['4b', 'employer', 'rc', 'cancelled', '1',
     'İşveren iptal edilmiş talepte seçer: talep ilerlemez',
     'select public.employer_decide_match(''{m3}''::uuid, ''selected'')']
  ];
  v_n text; v_actor text; v_req uuid; v_exp text; v_min int; v_label text; v_sql text;
  v_uid uuid; v_rows int; v_err text; v_status text;
  v_m1 uuid; v_m2 uuid; v_m3 uuid;
  v_k text; j_facts jsonb; j_emp jsonb; v_kexp jsonb; v_err_k text;
  v_audit int;
begin
  if coalesce(v_role_source, '') <> 'source_country' or coalesce(v_role_target, '') <> 'target_country' then
    perform pg_temp.rec('1-4', 'Kayıtlara göre otomatik ilerleme (gerçek kullanım yoluyla)', null,
      format('Kaynak hesabının rolü "%s", Hedef hesabının rolü "%s" (beklenen source_country / target_country)',
        v_role_source, v_role_target));
    return;
  end if;

  for i in 1 .. array_length(v_steps, 1) loop
    v_n := v_steps[i][1];
    v_actor := v_steps[i][2];
    v_req := case v_steps[i][3] when 'rs' then v_rs else v_rc end;
    v_exp := v_steps[i][4];
    v_min := v_steps[i][5]::int;
    v_label := v_steps[i][6];

    select m.id into v_m1 from public.request_matches m where m.request_id = v_rs and m.candidate_id = v_c1;
    select m.id into v_m2 from public.request_matches m where m.request_id = v_rs and m.candidate_id = v_c2;
    select m.id into v_m3 from public.request_matches m where m.request_id = v_rc and m.candidate_id = v_c3;
    v_sql := replace(replace(replace(v_steps[i][7],
               '{m1}', coalesce(v_m1::text, '')),
               '{m2}', coalesce(v_m2::text, '')),
               '{m3}', coalesce(v_m3::text, ''));
    v_uid := case v_actor when 'source' then v_uid_source when 'target' then v_uid_target else v_uid_emp end;

    v_rows := 0; v_err := null;
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_uid::text, true);
      set local role authenticated;
      execute v_sql;
      get diagnostics v_rows = row_count;
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);

    select status into v_status from public.job_requests where id = v_req;
    perform pg_temp.rec(v_n, v_label,
      v_err is null and v_rows >= v_min and v_status = v_exp,
      format('kim=%s satır=%s hata=%s durum=%s (beklenen %s)%s',
        v_actor, v_rows, coalesce(v_err, '-'), v_status, v_exp,
        case when v_err is null and v_rows < v_min then ' — RLS kaydı göstermedi, adım yapılamadı' else '' end));

    -- 5x: the facts behind the status equal what the employer's cards show.
    -- Expected values too, so two equal but wrong definitions are caught:
    --   k1 after 3a: C1 documents_collecting (travel 'planned') = in process,
    --                C2 untouched ('planned') = no stage
    --   k2 after 4c: both started_work + completed = started
    if v_n in ('3a', '4c') then
      v_k := case v_n when '3a' then 'k1' else 'k2' end;
      v_kexp := case v_n
        when '3a' then '{"presented":2,"selected":2,"interviews":1,"in_process":1,"travel_ready":0,"started":0}'::jsonb
        else           '{"presented":2,"selected":2,"interviews":1,"in_process":0,"travel_ready":0,"started":2}'::jsonb
      end;
      if not v_has_counts then
        perform pg_temp.rec(v_k, 'request_status_facts = işverenin request_pipeline_counts_for_me sayıları', null,
          'public.request_pipeline_counts_for_me() yok (20261113120000)');
      else
        j_facts := null; j_emp := null; v_err_k := null;
        select to_jsonb(x) into j_facts
        from (select f.presented, f.selected, f.interviews, f.in_process, f.travel_ready, f.started
              from public.request_status_facts(v_rs) f) x;
        begin
          perform set_config('request.jwt.claims', json_build_object('sub', v_uid_emp, 'role', 'authenticated')::text, true);
          perform set_config('request.jwt.claim.sub', v_uid_emp::text, true);
          set local role authenticated;
          select to_jsonb(x) into j_emp
          from (select c.presented, c.selected, c.interviews, c.in_process, c.travel_ready, c.started
                from public.request_pipeline_counts_for_me() c where c.request_id = v_rs) x;
          reset role;
        exception when others then
          v_err_k := sqlerrm;
        end;
        reset role;
        perform set_config('request.jwt.claims', '', true);
        perform set_config('request.jwt.claim.sub', '', true);
        perform pg_temp.rec(v_k,
          format('request_status_facts = işverenin request_pipeline_counts_for_me sayıları = beklenen (%s sonrası)', v_n),
          v_err_k is null and j_emp is not null and j_facts = j_emp and j_facts = v_kexp,
          format('facts=%s işveren=%s beklenen=%s hata=%s',
            j_facts, coalesce(j_emp::text, 'satır yok'), v_kexp, coalesce(v_err_k, '-')));
      end if;
    end if;
  end loop;

  -- Audit for the automatic steps of RS.
  select count(*) into v_audit
  from public.audit_logs a
  where a.entity_type = 'job_request' and a.entity_id::text = v_rs::text
    and a.details ->> 'mode' = 'auto' and a.details ->> 'manual_override' = 'false'
    and a.details ? 'from' and a.details ? 'to';
  perform pg_temp.rec('ek', 'Otomatik ilerlemeler audit''e "auto" olarak yazılır',
    v_audit >= 6, format('auto_kaydı=%s (beklenen en az 6: aranıyor, sunuluyor, görüşme, seçim, süreç, seyahat)', v_audit));
end $$;

-- 3. Scenario 5: manual change -------------------------------------------------

do $$
declare
  v_has boolean := pg_temp.ctx('has_manual') = 'true';
  v_rm uuid := pg_temp.uid('rm');
  v_reason text := pg_temp.ctx('reason');
  v_up uuid := pg_temp.uid('uid_upper');
  v_role_up text := pg_temp.ctx('role_upper');
  v_uid_source uuid := pg_temp.uid('uid_source');
  v_uid_target uuid := pg_temp.uid('uid_target');
  v_uid_field uuid := pg_temp.uid('uid_field');
  v_role_source text := pg_temp.ctx('role_source');
  v_role_target text := pg_temp.ctx('role_target');
  v_role_field text := pg_temp.ctx('role_field');
  v_key text; v_uid uuid; v_role text; v_expected text;
  v_before text; v_after text;
  v_err text; v_err2 text; v_rows int;
  v_err_empty text; v_err_short text; v_err_direct text; v_rows_direct int; v_err_ok text; v_ret text;
  r record;
  v_audit boolean;
begin
  select status into v_before from public.job_requests where id = v_rm;

  if not v_has then
    perform pg_temp.rec('5', 'Durumu el ile yalnız Üst Yönetim, gerekçeyle değiştirir', null,
      'public.staff_set_request_status yok (Bölüm B uygulanmamış)');
    return;
  end if;

  -- 5a: Kaynak, Hedef, Saha.
  foreach v_key in array array['source', 'target', 'field'] loop
    v_uid := case v_key when 'source' then v_uid_source when 'target' then v_uid_target else v_uid_field end;
    v_role := case v_key when 'source' then v_role_source when 'target' then v_role_target else v_role_field end;
    v_expected := case v_key when 'source' then 'source_country' when 'target' then 'target_country' else 'field_officer' end;
    v_err := null; v_err2 := null; v_rows := 0;

    if coalesce(v_role, '') <> v_expected then
      perform pg_temp.rec('5a-' || v_key, format('%s durumu el ile değiştiremez', v_key), null,
        format('hesabın rolü "%s", beklenen "%s"', v_role, v_expected));
      continue;
    end if;

    begin
      perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
      set local role authenticated;
      perform public.staff_set_request_status(v_rm, 'cancelled', v_reason);
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;

    begin
      perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
      set local role authenticated;
      update public.job_requests set status = 'cancelled' where id = v_rm;
      get diagnostics v_rows = row_count;
      reset role;
    exception when others then
      v_err2 := sqlerrm;
    end;
    reset role;
    perform set_config('request.jwt.claims', '', true);
    select status into v_after from public.job_requests where id = v_rm;

    -- Source and target reach the request through RLS, so the guard must be
    -- what stops the direct update; the field officer may simply see 0 rows.
    perform pg_temp.rec('5a-' || v_key, format('%s (%s) durumu el ile değiştiremez', v_key, v_expected),
      coalesce(v_err, '') like '%staff_role_not_allowed%'
        and (coalesce(v_err2, '') like '%demand_status_use_rpc%' or (v_key = 'field' and v_err2 is null and v_rows = 0))
        and v_after = v_before,
      format('rpc=%s doğrudan=%s durum=%s',
        coalesce(v_err, 'HATA YOK (kabul edildi)'), coalesce(v_err2, v_rows || ' satır'), v_after));
  end loop;

  if coalesce(v_role_up, '') <> 'upper_management' then
    perform pg_temp.rec('5b-5d', 'Üst Yönetim el ile değiştirme', null, format('Üst Yönetim hesabının rolü "%s"', v_role_up));
    return;
  end if;

  -- 5b: no reason / too short.
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_up, 'role', 'authenticated')::text, true);
    set local role authenticated;
    perform public.staff_set_request_status(v_rm, 'cancelled', '');
    reset role;
  exception when others then v_err_empty := sqlerrm;
  end;
  reset role;
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_up, 'role', 'authenticated')::text, true);
    set local role authenticated;
    perform public.staff_set_request_status(v_rm, 'cancelled', ' abc ');
    reset role;
  exception when others then v_err_short := sqlerrm;
  end;
  reset role;
  select status into v_after from public.job_requests where id = v_rm;
  perform pg_temp.rec('5b', 'Üst Yönetim: gerekçesiz el ile değişiklik reddedilir',
    coalesce(v_err_empty, '') like '%status_reason_required%'
      and coalesce(v_err_short, '') like '%status_reason_required%' and v_after = v_before,
    format('boş=%s kısa=%s durum=%s', coalesce(v_err_empty, 'HATA YOK'), coalesce(v_err_short, 'HATA YOK'), v_after));

  -- 5c: even upper management cannot bypass the RPC.
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_up, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.job_requests set status = 'cancelled' where id = v_rm;
    get diagnostics v_rows_direct = row_count;
    reset role;
  exception when others then v_err_direct := sqlerrm;
  end;
  reset role;
  select status into v_after from public.job_requests where id = v_rm;
  perform pg_temp.rec('5c', 'Üst Yönetim de doğrudan güncelleme ile değiştiremez (yalnız RPC)',
    coalesce(v_err_direct, '') like '%demand_status_use_rpc%' and v_after = v_before,
    format('doğrudan=%s durum=%s', coalesce(v_err_direct, v_rows_direct || ' satır'), v_after));

  -- 5d: with a reason: changes, stores the reason, writes the audit row.
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_up, 'role', 'authenticated')::text, true);
    set local role authenticated;
    v_ret := public.staff_set_request_status(v_rm, 'cancelled', v_reason);
    reset role;
  exception when others then v_err_ok := sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  select status, closed_reason, closed_at into r from public.job_requests where id = v_rm;
  select exists (
    select 1 from public.audit_logs a
    where a.entity_type = 'job_request' and a.entity_id::text = v_rm::text
      and a.actor_user_id = v_up
      and a.details ->> 'mode' = 'manual'
      and a.details ->> 'manual_override' = 'true'
      and a.details ->> 'from' = v_before
      and a.details ->> 'to' = 'cancelled'
      and a.details ->> 'reason' = v_reason
      and a.details ->> 'staff_role' = 'upper_management'
  ) into v_audit;
  perform pg_temp.rec('5d', 'Üst Yönetim gerekçeyle değiştirir; audit''e eski/yeni durum, gerekçe, kişi, manual_override yazılır',
    v_err_ok is null and r.status = 'cancelled' and r.closed_reason = v_reason and r.closed_at is not null and v_audit,
    format('rpc=%s hata=%s durum=%s gerekçe_kayıtlı=%s audit=%s',
      v_ret, coalesce(v_err_ok, '-'), r.status, (r.closed_reason = v_reason), v_audit));
end $$;

-- 4. Scenario 6: anon and employer ---------------------------------------------

do $$
declare
  v_has boolean := pg_temp.ctx('has_manual') = 'true';
  v_rs uuid := pg_temp.uid('rs');
  v_emp uuid := pg_temp.uid('uid_employer');
  v_reason text := pg_temp.ctx('reason');
  v_before text; v_after text;
  v_err_adv text; v_err_set text; v_err_emp text;
begin
  select status into v_before from public.job_requests where id = v_rs;

  begin
    perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    perform set_config('request.jwt.claim.sub', '', true);
    set local role anon;
    perform public.advance_request_status(v_rs);
    reset role;
  exception when others then v_err_adv := sqlerrm;
  end;
  reset role;

  if v_has then
    begin
      perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
      set local role anon;
      perform public.staff_set_request_status(v_rs, 'cancelled', v_reason);
      reset role;
    exception when others then v_err_set := sqlerrm;
    end;
    reset role;
  end if;

  -- Employer: signed in, no trigger around the call.
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_emp, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_emp::text, true);
    set local role authenticated;
    perform public.advance_request_status(v_rs);
    reset role;
  exception when others then v_err_emp := sqlerrm;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  select status into v_after from public.job_requests where id = v_rs;

  perform pg_temp.rec('6a', 'Giriş yapmamış (anon) rol fonksiyonları çağıramaz',
    coalesce(v_err_adv, '') like 'permission denied%'
      and (not v_has or coalesce(v_err_set, '') like 'permission denied%'),
    format('advance=%s set_status=%s', coalesce(v_err_adv, 'ÇAĞRILABİLDİ'),
      case when v_has then coalesce(v_err_set, 'ÇAĞRILABİLDİ') else 'B yok, denenmedi' end));
  perform pg_temp.rec('6b', 'İşveren advance_request_status''u doğrudan çağıramaz',
    coalesce(v_err_emp, '') like '%request_not_found%' and v_after = v_before,
    format('hata=%s durum=%s', coalesce(v_err_emp, 'HATA YOK (çağrılabildi)'), v_after));
end $$;

-- 5. Results, then undo everything --------------------------------------------

select * from _results order by id;
rollback;
