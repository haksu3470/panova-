-- Scenario test for the request flow (employer decision, staff decision on the
-- employer's behalf, counts, automatic status, meeting link, anon access).
--
-- NOTHING IS KEPT. The whole file runs between `begin;` and `rollback;`.
-- There is no commit statement in this file.
--
-- Run it in the Supabase SQL Editor (or psql) as the postgres user, AFTER
-- 20261112120000_employer_match_decision.sql is applied.
--
-- The script never creates auth users. It looks the five accounts in
-- section 0 up in auth.users, stops at once if one is missing, and
-- impersonates them with `set local role` + request.jwt.claims.
-- pg_temp helpers are only called as postgres: every id is read into a
-- variable before impersonating.
--
-- Output: one NOTICE per check, and the last statement before the rollback
-- returns the result table (_results). Each check is GEÇTİ or KALDI. A check
-- that cannot be carried out is KALDI, with the reason in "ayrinti", e.g. the
-- object for that scenario does not exist yet (later steps of the plan):
--   5  -> view public.request_pipeline_counts        (step 2)
--   6  -> function public.advance_request_status      (step 5)
--   7a -> column public.interviews.meeting_url        (step 3)
--
-- Test data: every row it inserts has is_demo = true and a "TEST senaryo"
-- title, and all of it disappears with the rollback.

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
  -- A check that could not be carried out (p_ok null) is a failure, not a skip.
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
  v_role text;
  v_scope text;
  v_expected jsonb := '{"source":"source_country","target":"target_country","field":"field_officer","upper":"upper_management"}';
  v_emp_a uuid;
  v_emp_b uuid;
  v_name_a text;
  v_name_b text;
  v_country text;
  v_c uuid[];
  v_r1 uuid; v_rb uuid; v_r3 uuid; v_r4 uuid;
  v_id uuid;
begin
  -- Users from auth.users by e-mail. No user is created; a missing one stops
  -- the script here.
  for r in select k, v from _ctx where k like 'email\_%' loop
    v_uid := null;
    select u.id into v_uid from auth.users u where lower(u.email) = lower(btrim(r.v));
    if v_uid is null then
      raise exception 'auth.users içinde bulunamadı: % (%). Betik yeni kullanıcı oluşturmaz.', r.v, r.k;
    end if;
    perform pg_temp.put('uid_' || substr(r.k, 7), v_uid::text);
  end loop;

  -- Staff roles as the database sees them.
  foreach v_key in array array['source', 'target', 'field', 'upper'] loop
    perform set_config('request.jwt.claims', json_build_object('sub', pg_temp.uid('uid_' || v_key), 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', pg_temp.uid('uid_' || v_key)::text, true);
    v_role := null; v_scope := null;
    select lower(me.role_level), me.scope_country into v_role, v_scope from public.current_staff() me limit 1;
    perform pg_temp.put('role_' || v_key, coalesce(v_role, ''));
    perform pg_temp.put('scope_' || v_key, coalesce(v_scope, ''));
    if coalesce(v_role, '') <> v_expected ->> v_key then
      raise notice 'UYARI: % hesabının rolü "%" (beklenen "%"). İlgili senaryo KALDI olur.',
        v_key, coalesce(v_role, 'personel kaydı yok / e-posta doğrulanmamış'), v_expected ->> v_key;
    else
      raise notice 'Hesap %: rol=%, kapsam ülkesi=%', v_key, v_role, coalesce(nullif(v_scope, ''), '-');
    end if;
  end loop;

  -- Employer A = the TEST İşveren account's employer.
  perform set_config('request.jwt.claims', json_build_object('sub', pg_temp.uid('uid_employer'), 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', pg_temp.uid('uid_employer')::text, true);
  v_emp_a := public.my_employer_id();
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  if v_emp_a is null then
    raise exception 'TEST İşveren hesabı bir işveren kaydına bağlı değil (my_employer_id boş).';
  end if;
  select e.company_name, e.country into v_name_a, v_country from public.employers e where e.id = v_emp_a;

  -- Employer B = any other employer (no login needed; only its data is used).
  select e.id, e.company_name into v_emp_b, v_name_b
  from public.employers e where e.id <> v_emp_a
  order by e.is_demo desc nulls last
  limit 1;
  if v_emp_b is null then
    raise exception 'İkinci bir işveren kaydı yok; senaryo 2 ve 7b kurulamıyor.';
  end if;

  -- Requests sit in the target officer's scope country so that scope is not
  -- what blocks scenario 4.
  v_country := coalesce(nullif(pg_temp.ctx('scope_target'), ''), v_country);

  -- Nine candidates not yet linked to employer A or B, demo ones first.
  select array_agg(id) into v_c from (
    select c.id
    from public.job_candidates c
    where c.archived_at is null
      and not exists (
        select 1 from public.request_matches m
        join public.job_requests jr on jr.id = m.request_id
        where m.candidate_id = c.id and jr.employer_id in (v_emp_a, v_emp_b)
      )
    order by c.is_demo desc nulls last, c.id
    limit 9
  ) s;
  if coalesce(array_length(v_c, 1), 0) < 9 then
    raise exception 'En az 9 uygun aday gerekli, bulunan: %.', coalesce(array_length(v_c, 1), 0);
  end if;

  -- R1: employer A, headcount 5. M1-M4 presented, M5 not presented.
  insert into public.job_requests (employer_id, employer_name, sector, position_title, headcount,
                                   accommodation_provided, food_provided, status, country, is_demo)
  values (v_emp_a, v_name_a, 'construction', 'TEST senaryo R1', 5, true, true, 'searching_candidates', v_country, true)
  returning id into v_r1;
  perform pg_temp.put('r1', v_r1::text);
  for i in 1..5 loop
    insert into public.request_matches (request_id, candidate_id, bound_at, presented_at, is_demo)
    values (v_r1, v_c[i], now(), case when i <= 4 then now() end, true)
    returning id into v_id;
    perform pg_temp.put('m' || i, v_id::text);
  end loop;

  -- RB: employer B, one presented match.
  insert into public.job_requests (employer_id, employer_name, sector, position_title, headcount,
                                   accommodation_provided, food_provided, status, country, is_demo)
  values (v_emp_b, v_name_b, 'construction', 'TEST senaryo RB', 1, true, true, 'searching_candidates', v_country, true)
  returning id into v_rb;
  perform pg_temp.put('rb', v_rb::text);
  insert into public.request_matches (request_id, candidate_id, bound_at, presented_at, is_demo)
  values (v_rb, v_c[6], now(), now(), true) returning id into v_id;
  perform pg_temp.put('mb', v_id::text);

  -- R3: employer A, headcount 2, two presented matches, status presenting.
  insert into public.job_requests (employer_id, employer_name, sector, position_title, headcount,
                                   accommodation_provided, food_provided, status, country, is_demo)
  values (v_emp_a, v_name_a, 'construction', 'TEST senaryo R3', 2, true, true, 'searching_candidates', v_country, true)
  returning id into v_r3;
  perform pg_temp.put('r3', v_r3::text);
  insert into public.request_matches (request_id, candidate_id, bound_at, presented_at, is_demo)
  values (v_r3, v_c[7], now(), now(), true) returning id into v_id;
  perform pg_temp.put('m31', v_id::text);
  insert into public.request_matches (request_id, candidate_id, bound_at, presented_at, is_demo)
  values (v_r3, v_c[8], now(), now(), true) returning id into v_id;
  perform pg_temp.put('m32', v_id::text);
  -- M33: the R1/M1 candidate presented on a second request of employer A, so
  -- the browse list must show that candidate twice (once per request).
  -- R3's headcount counts selections only, so this does not change scenario 6.
  insert into public.request_matches (request_id, candidate_id, bound_at, presented_at, is_demo)
  values (v_r3, v_c[1], now(), now(), true) returning id into v_id;
  perform pg_temp.put('m33', v_id::text);
  perform pg_temp.put('c1', v_c[1]::text);
  update public.job_requests set status = 'presenting_candidates' where id = v_r3;

  -- R4: employer A, cancelled, one presented match.
  insert into public.job_requests (employer_id, employer_name, sector, position_title, headcount,
                                   accommodation_provided, food_provided, status, country, is_demo)
  values (v_emp_a, v_name_a, 'construction', 'TEST senaryo R4', 1, true, true, 'cancelled', v_country, true)
  returning id into v_r4;
  perform pg_temp.put('r4', v_r4::text);
  insert into public.request_matches (request_id, candidate_id, bound_at, presented_at, is_demo)
  values (v_r4, v_c[9], now(), now(), true) returning id into v_id;
  perform pg_temp.put('m41', v_id::text);

  -- One interview for employer A (R1/M1 candidate) and one for employer B.
  insert into public.interviews (request_id, candidate_id, employer_id, scheduled_at, status, is_demo)
  values (v_r1, v_c[1], v_emp_a, now() + interval '1 day', 'scheduled', true) returning id into v_id;
  perform pg_temp.put('iv_a', v_id::text);
  insert into public.interviews (request_id, candidate_id, employer_id, scheduled_at, status, is_demo)
  values (v_rb, v_c[6], v_emp_b, now() + interval '1 day', 'scheduled', true) returning id into v_id;
  perform pg_temp.put('iv_b', v_id::text);

  -- Which later-step objects exist.
  perform pg_temp.put('has_counts_view', (to_regclass('public.request_pipeline_counts') is not null)::text);
  perform pg_temp.put('has_auto_status', exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'advance_request_status')::text);
  perform pg_temp.put('has_meeting_url', exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'interviews' and column_name = 'meeting_url')::text);

  perform pg_temp.put('reason', 'TEST: işveren 12 Kasım telefon görüşmesinde onay verdi');
  raise notice 'Test verisi hazır: R1=%, RB=%, R3=%, R4=% (hepsi rollback ile silinecek).', v_r1, v_rb, v_r3, v_r4;
end $$;

-- 2. Scenario 1: employer selects own match ------------------------------------

do $$
declare
  v_emp uuid := pg_temp.uid('uid_employer');
  v_m1 uuid := pg_temp.uid('m1');
  v_m5 uuid := pg_temp.uid('m5');
  v_ret text; v_err text; v_err5 text; v_browse boolean := false;
  r record;
begin
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_emp, 'role', 'authenticated')::text, true);
    set local role authenticated;
    v_ret := public.employer_decide_match(v_m1, 'selected');
    select exists (select 1 from public.employer_browse_candidates() b
                   where b.match_id = v_m1 and b.employer_decision = 'selected') into v_browse;
    reset role;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;
  select employer_decision, decided_by, decision_source into r from public.request_matches where id = v_m1;
  perform pg_temp.rec('1', 'İşveren kendi talebindeki eşleşmeyi seçer',
    v_err is null and r.employer_decision = 'selected' and r.decided_by = v_emp
      and r.decision_source = 'employer' and v_browse,
    format('rpc=%s hata=%s karar=%s decided_by_dolu=%s kaynak=%s işveren_listesinde_görünür=%s',
      v_ret, coalesce(v_err, '-'), r.employer_decision, (r.decided_by is not null), r.decision_source, v_browse));

  -- Not presented yet: must be refused.
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_emp, 'role', 'authenticated')::text, true);
    set local role authenticated;
    perform public.employer_decide_match(v_m5, 'selected');
    reset role;
  exception when others then
    v_err5 := sqlerrm;
  end;
  reset role;
  perform pg_temp.rec('1b', 'İşveren sunulmamış adayı seçemez',
    coalesce(v_err5, '') like '%not_presented%'
      and (select employer_decision from public.request_matches where id = v_m5) = 'pending',
    format('hata=%s', coalesce(v_err5, 'HATA YOK (kabul edildi)')));
end $$;

-- 2b. Scenario 1c: browse list is per presented match --------------------------

do $$
declare
  v_emp uuid := pg_temp.uid('uid_employer');
  v_c1 uuid := pg_temp.uid('c1');
  v_m1 uuid := pg_temp.uid('m1');
  v_m33 uuid := pg_temp.uid('m33');
  v_m5 uuid := pg_temp.uid('m5');
  v_rows_c1 int := -1; v_has_m1 boolean; v_has_m33 boolean; v_has_m5 boolean;
  v_unpresented int := -1; v_dupes int := -1; v_titles text; v_err text;
begin
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_emp, 'role', 'authenticated')::text, true);
    set local role authenticated;
    select count(*),
           bool_or(b.match_id = v_m1),
           bool_or(b.match_id = v_m33),
           string_agg(coalesce(b.request_position_title, '-'), ' + ' order by b.request_position_title)
      into v_rows_c1, v_has_m1, v_has_m33, v_titles
    from public.employer_browse_candidates() b where b.id = v_c1;
    select coalesce(bool_or(b.match_id = v_m5), false),
           count(*) filter (where b.presented_at is null),
           count(*) - count(distinct b.match_id)
      into v_has_m5, v_unpresented, v_dupes
    from public.employer_browse_candidates() b;
    reset role;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;
  perform pg_temp.rec('1c', 'İşveren listesi eşleşme başına: iki talepteki aday iki satır, sunulmamış aday yok',
    v_err is null and v_rows_c1 = 2 and v_has_m1 and v_has_m33
      and not v_has_m5 and v_unpresented = 0 and v_dupes = 0,
    format('aday_satırı=%s M1=%s M33=%s pozisyonlar=%s sunulmamış_M5_görünüyor=%s presented_null=%s tekrar=%s hata=%s',
      v_rows_c1, v_has_m1, v_has_m33, v_titles, v_has_m5, v_unpresented, v_dupes, coalesce(v_err, '-')));
end $$;

-- 3. Scenario 2: employer A tries employer B's match ---------------------------

do $$
declare
  v_emp uuid := pg_temp.uid('uid_employer');
  v_mb uuid := pg_temp.uid('mb');
  v_err text; v_err2 text; v_rows int := 0;
begin
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_emp, 'role', 'authenticated')::text, true);
    set local role authenticated;
    perform public.employer_decide_match(v_mb, 'selected');
    reset role;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;

  -- Direct table write, bypassing the RPC.
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_emp, 'role', 'authenticated')::text, true);
    set local role authenticated;
    update public.request_matches set employer_decision = 'selected' where id = v_mb;
    get diagnostics v_rows = row_count;
    reset role;
  exception when others then
    v_err2 := sqlerrm;
  end;
  reset role;

  perform pg_temp.rec('2', 'İşveren başka işverenin eşleşmesini seçemez',
    coalesce(v_err, '') like '%match_not_found%' and v_rows = 0
      and (select employer_decision from public.request_matches where id = v_mb) = 'pending',
    format('rpc_hatası=%s doğrudan_update_satır=%s doğrudan_update_hatası=%s',
      coalesce(v_err, 'HATA YOK (kabul edildi)'), v_rows, coalesce(v_err2, '-')));
end $$;

-- 4. Scenario 3: source country and field officer cannot decide ----------------

do $$
declare
  -- Everything this block needs is read here, as postgres.
  v_uid_source uuid := pg_temp.uid('uid_source');
  v_uid_field uuid := pg_temp.uid('uid_field');
  v_role_source text := pg_temp.ctx('role_source');
  v_role_field text := pg_temp.ctx('role_field');
  v_m3 uuid := pg_temp.uid('m3');
  v_reason text := pg_temp.ctx('reason');
  v_key text;
  v_uid uuid;
  v_role text;
  v_expected text;
  v_err text; v_err2 text; v_rows int;
begin
  foreach v_key in array array['source', 'field'] loop
    v_uid := case v_key when 'source' then v_uid_source else v_uid_field end;
    v_role := case v_key when 'source' then v_role_source else v_role_field end;
    v_expected := case v_key when 'source' then 'source_country' else 'field_officer' end;
    v_err := null; v_err2 := null; v_rows := 0;

    if coalesce(v_role, '') <> v_expected then
      perform pg_temp.rec('3', format('%s işveren adına karar giremez', v_key), null,
        format('hesabın rolü "%s", beklenen "%s"', v_role, v_expected));
      continue;
    end if;

    begin
      perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
      set local role authenticated;
      perform public.staff_decide_match(v_m3, 'selected', v_reason);
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;

    -- Direct table write must not get past the guard trigger either.
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
      set local role authenticated;
      update public.request_matches set employer_result = 'selected' where id = v_m3;
      get diagnostics v_rows = row_count;
      reset role;
    exception when others then
      v_err2 := sqlerrm;
    end;
    reset role;

    perform pg_temp.rec('3', format('%s (%s) işveren adına karar giremez', v_key, v_expected),
      coalesce(v_err, '') like '%staff_role_not_allowed%'
        and (v_err2 is not null or v_rows = 0)
        and (select employer_decision from public.request_matches where id = v_m3) = 'pending',
      format('rpc_hatası=%s doğrudan_update=%s',
        coalesce(v_err, 'HATA YOK (kabul edildi)'),
        coalesce(v_err2, v_rows || ' satır')));
  end loop;
end $$;

-- 5. Scenario 4: target country decides; reason required; audit written -------

do $$
declare
  v_uid uuid := pg_temp.uid('uid_target');
  v_role text := pg_temp.ctx('role_target');
  v_m2 uuid := pg_temp.uid('m2');
  v_reason text := pg_temp.ctx('reason');
  v_err_empty text; v_err_short text; v_err text; v_ret text;
  v_audit boolean;
  r record;
begin
  if coalesce(v_role, '') <> 'target_country' then
    perform pg_temp.rec('4', 'Hedef Ülke işveren adına karar girer', null,
      format('hesabın rolü "%s", beklenen "target_country"', v_role));
    return;
  end if;

  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    set local role authenticated;
    perform public.staff_decide_match(v_m2, 'selected', '');
    reset role;
  exception when others then
    v_err_empty := sqlerrm;
  end;
  reset role;

  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    set local role authenticated;
    perform public.staff_decide_match(v_m2, 'selected', '  abc ');
    reset role;
  exception when others then
    v_err_short := sqlerrm;
  end;
  reset role;

  perform pg_temp.rec('4a', 'Hedef Ülke: gerekçesiz karar reddedilir',
    coalesce(v_err_empty, '') like '%decision_reason_required%'
      and coalesce(v_err_short, '') like '%decision_reason_required%'
      and (select employer_decision from public.request_matches where id = v_m2) = 'pending',
    format('boş=%s kısa=%s', coalesce(v_err_empty, 'HATA YOK'), coalesce(v_err_short, 'HATA YOK')));

  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
    set local role authenticated;
    v_ret := public.staff_decide_match(v_m2, 'selected', v_reason);
    reset role;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;

  select employer_decision, decision_source, decision_reason, decided_by into r
  from public.request_matches where id = v_m2;
  perform pg_temp.rec('4b', 'Hedef Ülke: gerekçeyle karar kabul edilir',
    v_err is null and r.employer_decision = 'selected' and r.decision_source = 'staff'
      and r.decision_reason = v_reason and r.decided_by = v_uid,
    format('rpc=%s hata=%s karar=%s kaynak=%s%s',
      v_ret, coalesce(v_err, '-'), r.employer_decision, r.decision_source,
      case when coalesce(v_err, '') like '%match_not_found%'
        then ' (ipucu: Test Hedef Ülke hesabının scope_country alanı boş ya da talebin ülkesiyle eşleşmiyor)' else '' end));

  select exists (
    select 1 from public.audit_logs a
    where a.entity_type = 'request_match'
      and a.entity_id::text = v_m2::text
      and a.actor_user_id = v_uid
      and a.details ->> 'actor' = 'staff'
      and a.details ->> 'from' = 'pending'
      and a.details ->> 'to' = 'selected'
      and a.details ->> 'reason' = v_reason
      and a.details ->> 'staff_role' = 'target_country'
  ) into v_audit;
  perform pg_temp.rec('4c', 'Hedef Ülke kararı audit kaydına yazılır (eski/yeni karar, gerekçe, kişi)',
    v_audit, format('audit_kaydı_bulundu=%s', v_audit));
end $$;

-- 6. Scenario 5: card counts are the same for employer and management ---------

do $$
declare
  v_emp uuid := pg_temp.uid('uid_employer');
  v_up uuid := pg_temp.uid('uid_upper');
  v_r1 uuid := pg_temp.uid('r1');
  v_rb uuid := pg_temp.uid('rb');
  j_emp jsonb; j_up jsonb; v_emp_sees_b int := -1; v_err text;
begin
  if pg_temp.ctx('has_counts_view') <> 'true' then
    perform pg_temp.rec('5', 'Kart sayıları işveren ve yönetimde aynı', null,
      'public.request_pipeline_counts görünümü henüz yok (Adım 2)');
    return;
  end if;

  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_emp, 'role', 'authenticated')::text, true);
    set local role authenticated;
    execute 'select to_jsonb(v) from public.request_pipeline_counts v where v.request_id = $1' into j_emp using v_r1;
    execute 'select count(*) from public.request_pipeline_counts v where v.request_id = $1' into v_emp_sees_b using v_rb;
    reset role;
    perform set_config('request.jwt.claims', json_build_object('sub', v_up, 'role', 'authenticated')::text, true);
    set local role authenticated;
    execute 'select to_jsonb(v) from public.request_pipeline_counts v where v.request_id = $1' into j_up using v_r1;
    reset role;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;

  -- At this point R1 has 5 matches, 4 presented, 2 selected (M1, M2).
  perform pg_temp.rec('5', 'Kart sayıları işveren ve yönetimde aynı, talep başına doğru',
    v_err is null and j_emp is not null and j_emp = j_up and v_emp_sees_b = 0
      and (not (j_emp ? 'matched') or (j_emp ->> 'matched')::int = 5)
      and (not (j_emp ? 'presented') or (j_emp ->> 'presented')::int = 4)
      and (not (j_emp ? 'selected') or (j_emp ->> 'selected')::int = 2),
    format('hata=%s işveren=%s yönetim=%s işveren_B_talebini_görüyor=%s',
      coalesce(v_err, '-'), j_emp, j_up, v_emp_sees_b));
end $$;

-- 7. Scenario 6: status advances on selections; not cancelled; never backward --

do $$
declare
  -- Ids are read here, as postgres; pg_temp helpers are never called while
  -- impersonating.
  v_up uuid := pg_temp.uid('uid_upper');
  v_reason text := pg_temp.ctx('reason');
  v_r3 uuid := pg_temp.uid('r3');
  v_r4 uuid := pg_temp.uid('r4');
  v_m31 uuid := pg_temp.uid('m31');
  v_m32 uuid := pg_temp.uid('m32');
  v_m41 uuid := pg_temp.uid('m41');
  v_auto boolean := pg_temp.ctx('has_auto_status') = 'true';
  v_role text := pg_temp.ctx('role_upper');
  s0 text; s1 text; s2 text; s3 text; s4 text; v_err text;
begin
  if coalesce(v_role, '') <> 'upper_management' then
    perform pg_temp.rec('6', 'Talep durumu kendiliğinden ilerler', null,
      format('Üst Yönetim hesabının rolü "%s"', v_role));
    return;
  end if;

  select status into s0 from public.job_requests where id = v_r3;
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_up, 'role', 'authenticated')::text, true);
    set local role authenticated;
    perform public.staff_decide_match(v_m31, 'selected', v_reason);   -- 1 of 2
    reset role;
    select status into s1 from public.job_requests where id = v_r3;
    set local role authenticated;
    perform public.staff_decide_match(v_m32, 'selected', v_reason);   -- 2 of 2 = headcount
    reset role;
    select status into s2 from public.job_requests where id = v_r3;
    set local role authenticated;
    perform public.staff_decide_match(v_m32, 'pending', v_reason);    -- undo one
    reset role;
    select status into s3 from public.job_requests where id = v_r3;
    set local role authenticated;
    perform public.staff_decide_match(v_m41, 'selected', v_reason);   -- cancelled request
    reset role;
    select status into s4 from public.job_requests where id = v_r4;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;

  if not v_auto then
    perform pg_temp.rec('6', 'Talep durumu kendiliğinden ilerler / iptali ilerletmez / geri gitmez', null,
      format('public.advance_request_status henüz yok (Adım 5). Gözlenen R3: %s -> %s -> %s -> %s, R4: %s, hata=%s',
        s0, s1, s2, s3, s4, coalesce(v_err, '-')));
    return;
  end if;

  perform pg_temp.rec('6a', 'Seçilen = kişi sayısı olunca talep "selection_completed" olur',
    v_err is null and s1 <> 'selection_completed' and s2 = 'selection_completed',
    format('başlangıç=%s 1_seçim=%s 2_seçim=%s hata=%s', s0, s1, s2, coalesce(v_err, '-')));
  perform pg_temp.rec('6b', 'Seçim geri alınınca durum geri gitmez',
    v_err is null and s3 = 'selection_completed', format('geri_alma_sonrası=%s', s3));
  perform pg_temp.rec('6c', 'İptal edilmiş talep ilerlemez',
    v_err is null and s4 = 'cancelled', format('R4=%s', s4));
end $$;

-- 8. Scenario 7: meeting link (http/https only) and interview visibility ------

do $$
declare
  v_emp uuid := pg_temp.uid('uid_employer');
  v_up uuid := pg_temp.uid('uid_upper');
  v_iv_a uuid := pg_temp.uid('iv_a');
  v_iv_b uuid := pg_temp.uid('iv_b');
  v_has_url boolean := pg_temp.ctx('has_meeting_url') = 'true';
  v_bad text[] := array['javascript:alert(1)', 'ftp://ornek.com/x', 'ornek.com/toplanti', 'data:text/html,<b>x</b>'];
  v_good text[] := array['https://meet.ornek.com/abc', 'http://ornek.com/toplanti'];
  v_url text; v_ok boolean := true; v_detail text := ''; v_err text; v_n int;
  v_sees_own int := -1; v_sees_other int := -1;
begin
  -- 7a: only http/https links are stored. Written as upper management.
  if not v_has_url then
    perform pg_temp.rec('7a', 'Görüşme bağlantısı yalnız http/https kabul eder', null,
      'public.interviews.meeting_url sütunu henüz yok (Adım 3)');
  else
    foreach v_url in array v_bad loop
      v_err := null;
      begin
        perform set_config('request.jwt.claims', json_build_object('sub', v_up, 'role', 'authenticated')::text, true);
        set local role authenticated;
        execute 'update public.interviews set meeting_url = $1 where id = $2' using v_url, v_iv_a;
        get diagnostics v_n = row_count;
        reset role;
      exception when others then
        v_err := sqlstate;
      end;
      reset role;
      -- Only a real rejection counts; 0 rows (RLS) would hide the check.
      if v_err is null then v_ok := false; end if;
      v_detail := v_detail || format('%s=>%s; ', v_url,
        coalesce('red ' || v_err, case when v_n = 0 then '0 satır (RLS, kontrol edilemedi)' else 'KABUL EDİLDİ' end));
    end loop;
    foreach v_url in array v_good loop
      v_err := null;
      begin
        perform set_config('request.jwt.claims', json_build_object('sub', v_up, 'role', 'authenticated')::text, true);
        set local role authenticated;
        execute 'update public.interviews set meeting_url = $1 where id = $2' using v_url, v_iv_a;
        get diagnostics v_n = row_count;
        reset role;
      exception when others then
        v_err := sqlerrm;
      end;
      reset role;
      if v_err is not null or v_n <> 1 then v_ok := false; end if;
      v_detail := v_detail || format('%s=>%s; ', v_url,
        coalesce('HATA ' || v_err, case when v_n = 1 then 'kabul' else v_n || ' satır' end));
    end loop;
    perform pg_temp.rec('7a', 'Görüşme bağlantısı yalnız http/https kabul eder', v_ok, v_detail);
  end if;

  -- 7b: the employer sees only their own interview.
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_emp, 'role', 'authenticated')::text, true);
    set local role authenticated;
    select count(*) into v_sees_own from public.interviews where id = v_iv_a;
    select count(*) into v_sees_other from public.interviews where id = v_iv_b;
    reset role;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;
  perform pg_temp.rec('7b', 'İşveren yalnız kendi görüşmesini görür',
    v_sees_own = 1 and v_sees_other = 0,
    format('kendi_görüşmesi=%s başka_işverenin=%s hata=%s', v_sees_own, v_sees_other, coalesce(v_err, '-')));
end $$;

-- 9. Scenario 8: anon cannot call the functions --------------------------------

do $$
declare
  v_m1 uuid := pg_temp.uid('m1');
  v_reason text := pg_temp.ctx('reason');
  v_has_view boolean := pg_temp.ctx('has_counts_view') = 'true';
  v_calls text[] := array['employer_decide_match', 'staff_decide_match', 'employer_browse_candidates'];
  v_call text; v_err text; v_ok boolean := true; v_detail text := ''; v_rows int;
begin
  foreach v_call in array v_calls loop
    v_err := null;
    begin
      perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
      perform set_config('request.jwt.claim.sub', '', true);
      set local role anon;
      if v_call = 'employer_decide_match' then
        perform public.employer_decide_match(v_m1, 'rejected');
      elsif v_call = 'staff_decide_match' then
        perform public.staff_decide_match(v_m1, 'rejected', v_reason);
      else
        perform * from public.employer_browse_candidates();
      end if;
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;
    -- Must be refused by privilege, not by a check inside the function.
    if coalesce(v_err, '') not like 'permission denied%' then v_ok := false; end if;
    v_detail := v_detail || format('%s=>%s; ', v_call, coalesce(v_err, 'ÇAĞRILABİLDİ'));
  end loop;

  if v_has_view then
    v_err := null; v_rows := null;
    begin
      perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
      set local role anon;
      execute 'select count(*) from public.request_pipeline_counts' into v_rows;
      reset role;
    exception when others then
      v_err := sqlerrm;
    end;
    reset role;
    if v_err is null and v_rows <> 0 then v_ok := false; end if;
    v_detail := v_detail || format('request_pipeline_counts=>%s; ', coalesce(v_err, v_rows || ' satır'));
  end if;

  perform pg_temp.rec('8', 'Giriş yapmamış (anon) rol fonksiyonları çağıramaz', v_ok, v_detail);
  -- The decision on M1 must still be the employer's from scenario 1.
  perform pg_temp.rec('8b', 'anon denemesinden sonra veri değişmedi',
    (select employer_decision from public.request_matches where id = v_m1) = 'selected', null);
end $$;

-- 10. Extra (rule 4 and 5): staff badge, then employer overrides ---------------

do $$
declare
  v_emp uuid := pg_temp.uid('uid_employer');
  v_up uuid := pg_temp.uid('uid_upper');
  v_m4 uuid := pg_temp.uid('m4');
  v_reason text := pg_temp.ctx('reason');
  v_role text := pg_temp.ctx('role_upper');
  v_src_seen text; v_err text; v_audit boolean;
  r record;
begin
  if coalesce(v_role, '') <> 'upper_management' then
    perform pg_temp.rec('ek', 'İşveren kararı personel kararını geçersiz kılar', null,
      format('Üst Yönetim hesabının rolü "%s"', v_role));
    return;
  end if;
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_up, 'role', 'authenticated')::text, true);
    set local role authenticated;
    perform public.staff_decide_match(v_m4, 'selected', v_reason);
    reset role;
    -- What the employer screen gets: decision_source drives the badge.
    perform set_config('request.jwt.claims', json_build_object('sub', v_emp, 'role', 'authenticated')::text, true);
    set local role authenticated;
    select b.decision_source into v_src_seen from public.employer_browse_candidates() b where b.match_id = v_m4;
    perform public.employer_decide_match(v_m4, 'rejected');
    reset role;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;

  select employer_decision, decision_source, decision_reason into r from public.request_matches where id = v_m4;
  select exists (
    select 1 from public.audit_logs a
    where a.entity_type = 'request_match'
      and a.entity_id::text = v_m4::text
      and a.actor_user_id = v_emp
      and a.details ->> 'overrode_staff_decision' = 'true'
      and a.details ->> 'previous_reason' = v_reason
      and a.details ->> 'from' = 'selected'
      and a.details ->> 'to' = 'rejected'
  ) into v_audit;

  perform pg_temp.rec('ek-a', 'İşveren ekranı personel kararını "staff" kaynağıyla alır (rozet)',
    v_src_seen = 'staff', format('işverene_dönen_kaynak=%s hata=%s', v_src_seen, coalesce(v_err, '-')));
  perform pg_temp.rec('ek-b', 'İşveren kararı personel kararını geçersiz kılar ve audit''e yazılır',
    v_err is null and r.employer_decision = 'rejected' and r.decision_source = 'employer'
      and r.decision_reason is null and v_audit,
    format('karar=%s kaynak=%s gerekçe_temizlendi=%s audit=%s',
      r.employer_decision, r.decision_source, (r.decision_reason is null), v_audit));
end $$;

-- 11. Results, then undo everything --------------------------------------------

select * from _results order by id;
rollback;
