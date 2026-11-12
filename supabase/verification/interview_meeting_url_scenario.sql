-- Scenario test for the meeting link rule
-- (20261113130000_interview_meeting_url.sql):
--
--   1  Kaynak Ülke and Saha cannot add or change interviews.meeting_url
--   2  Hedef Ülke and Üst Yönetim can add and change it
--   3  a javascript: link is rejected (also for the allowed roles)
--   4  an employer sees its own interview's link, not another employer's,
--      and cannot change its own
--
-- NOTHING IS KEPT. The whole file runs between `begin;` and `rollback;`.
-- There is no commit statement in this file.
--
-- Run it in the Supabase SQL Editor (or psql) as the postgres user, AFTER the
-- migration is applied. It stops at once if the column or trigger is missing.
--
-- Same accounts and method as employer_match_scenario.sql: the script never
-- creates auth users; it looks the five accounts up in auth.users and
-- impersonates them with `set local role` + request.jwt.claims. pg_temp
-- helpers are only called as postgres.
--
-- So that row security is not what stops Kaynak / Saha (which would hide the
-- rule), the test candidate carries the source officer's referral code and
-- scope nationality, and is assigned to the field officer. Each of those
-- checks first proves the officer can update another column of the same
-- interview; if not, the check is KALDI with the reason.
--
-- Output: one NOTICE per check; the last statement before the rollback
-- returns the result table (_results). Each check is GEÇTİ or KALDI.
-- Test rows have is_demo = true and a "TEST bağlantı" title.

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
  v_role text; v_scope text; v_staff uuid; v_code text;
  v_expected jsonb := '{"source":"source_country","target":"target_country","field":"field_officer","upper":"upper_management"}';
  v_emp_a uuid; v_emp_b uuid; v_name_a text; v_name_b text;
  v_country text; v_nat text;
  v_missing text;
  v_run text := substr(md5(clock_timestamp()::text || random()::text), 1, 8);
  v_c1 uuid; v_c2 uuid; v_ra uuid; v_rb uuid; v_id uuid;
begin
  -- The migration must be in place.
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'interviews' and column_name = 'meeting_url') then
    raise exception 'public.interviews.meeting_url yok. Önce 20261113130000_interview_meeting_url.sql uygulanmalı.';
  end if;
  if not exists (select 1 from pg_trigger
                 where tgrelid = 'public.interviews'::regclass and tgname = 'interviews_guard_meeting_url') then
    raise exception 'interviews_guard_meeting_url tetikleyicisi yok. Migration''ın güncel hâli uygulanmalı.';
  end if;

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
    v_role := null; v_scope := null; v_staff := null; v_code := null;
    select lower(me.role_level), me.scope_country, me.staff_id, me.referral_code
      into v_role, v_scope, v_staff, v_code
    from public.current_staff() me limit 1;
    perform pg_temp.put('role_' || v_key, coalesce(v_role, ''));
    perform pg_temp.put('scope_' || v_key, coalesce(v_scope, ''));
    perform pg_temp.put('staff_' || v_key, coalesce(v_staff::text, ''));
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
  -- Back to "no end user" before any insert (referral-code trigger reads it).
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  if v_emp_a is null then
    raise exception 'TEST İşveren hesabı bir işveren kaydına bağlı değil (my_employer_id boş).';
  end if;
  select e.company_name, e.country into v_name_a, v_country from public.employers e where e.id = v_emp_a;

  select e.id, e.company_name into v_emp_b, v_name_b
  from public.employers e where e.id <> v_emp_a
  order by e.is_demo desc nulls last
  limit 1;
  if v_emp_b is null then
    raise exception 'İkinci bir işveren kaydı yok; senaryo 4 kurulamıyor.';
  end if;

  -- Requests in the target officer's scope country, so Hedef Ülke reaches
  -- the candidate through RLS.
  v_country := coalesce(nullif(pg_temp.ctx('scope_target'), ''), v_country);
  -- Candidate nationality = source officer's scope country (second way the
  -- source officer reaches the candidate, next to the referral code).
  v_nat := coalesce(nullif(pg_temp.ctx('scope_source'), ''), 'Belirtilmedi');

  select string_agg(t.tbl || '.' || col.column_name, ', ' order by t.tbl, col.column_name) into v_missing
  from (values
    ('job_candidates',  array['full_name', 'nationality', 'phone', 'email', 'profession',
                              'sector', 'passport_number', 'status', 'is_demo',
                              'referral_code', 'assigned_to']),
    ('job_requests',    array['employer_id', 'employer_name', 'sector', 'position_title', 'headcount',
                              'monthly_net_salary', 'accommodation_provided', 'food_provided',
                              'status', 'country', 'is_demo']),
    ('request_matches', array['request_id', 'candidate_id', 'bound_at', 'presented_at', 'is_demo']),
    ('interviews',      array['request_id', 'candidate_id', 'employer_id', 'scheduled_at', 'status',
                              'is_demo', 'meeting_url'])
  ) as t(tbl, covered)
  join information_schema.columns col
    on col.table_schema = 'public' and col.table_name = t.tbl
  where col.is_nullable = 'NO' and col.column_default is null
    and col.is_identity = 'NO' and col.is_generated = 'NEVER'
    and col.column_name <> all (t.covered);
  if v_missing is not null then
    raise exception 'Zorunlu, varsayılansız sütun betiğin insert''lerinde yok: %. Betiği bu sütunlarla güncelleyin.', v_missing;
  end if;

  -- C1: reachable by all four staff accounts. C2: employer B's candidate.
  insert into public.job_candidates (full_name, nationality, phone, email, profession, sector,
                                     passport_number, status, is_demo, referral_code, assigned_to)
  values ('TEST bağlantı aday 1', v_nat, 'p-mtg-' || v_run || '-1',
          'test-baglanti-' || v_run || '-1@example.invalid', 'Belirtilmedi', 'construction',
          'TMTG' || upper(v_run) || '1', 'pending', true,
          nullif(pg_temp.ctx('code_source'), ''), pg_temp.uid('staff_field'))
  returning id into v_c1;
  insert into public.job_candidates (full_name, nationality, phone, email, profession, sector,
                                     passport_number, status, is_demo)
  values ('TEST bağlantı aday 2', v_nat, 'p-mtg-' || v_run || '-2',
          'test-baglanti-' || v_run || '-2@example.invalid', 'Belirtilmedi', 'construction',
          'TMTG' || upper(v_run) || '2', 'pending', true)
  returning id into v_c2;
  perform pg_temp.put('c1', v_c1::text);

  insert into public.job_requests (employer_id, employer_name, sector, position_title, headcount,
                                   monthly_net_salary, accommodation_provided, food_provided, status, country, is_demo)
  values (v_emp_a, v_name_a, 'construction', 'TEST bağlantı RA', 3, 1000, true, true, 'searching_candidates', v_country, true)
  returning id into v_ra;
  insert into public.job_requests (employer_id, employer_name, sector, position_title, headcount,
                                   monthly_net_salary, accommodation_provided, food_provided, status, country, is_demo)
  values (v_emp_b, v_name_b, 'construction', 'TEST bağlantı RB', 1, 1000, true, true, 'searching_candidates', v_country, true)
  returning id into v_rb;
  perform pg_temp.put('ra', v_ra::text);
  perform pg_temp.put('emp_a', v_emp_a::text);

  insert into public.request_matches (request_id, candidate_id, bound_at, presented_at, is_demo)
  values (v_ra, v_c1, now(), now(), true);
  insert into public.request_matches (request_id, candidate_id, bound_at, presented_at, is_demo)
  values (v_rb, v_c2, now(), now(), true);

  -- IV_A: employer A, no link yet. IV_B: employer B, link set as postgres.
  insert into public.interviews (request_id, candidate_id, employer_id, scheduled_at, status, is_demo)
  values (v_ra, v_c1, v_emp_a, now() + interval '1 day', 'scheduled', true) returning id into v_id;
  perform pg_temp.put('iv_a', v_id::text);
  insert into public.interviews (request_id, candidate_id, employer_id, scheduled_at, status, is_demo, meeting_url)
  values (v_rb, v_c2, v_emp_b, now() + interval '1 day', 'scheduled', true, 'https://gizli.ornek.com/isveren-b')
  returning id into v_id;
  perform pg_temp.put('iv_b', v_id::text);

  raise notice 'Test verisi hazır: RA=%, RB=%, IV_A=%, IV_B=% (hepsi rollback ile silinecek).',
    v_ra, v_rb, pg_temp.ctx('iv_a'), pg_temp.ctx('iv_b');
end $$;

-- 2. Scenario 1: Kaynak Ülke and Saha cannot add the link ---------------------

do $$
declare
  v_uid_source uuid := pg_temp.uid('uid_source');
  v_uid_field uuid := pg_temp.uid('uid_field');
  v_role_source text := pg_temp.ctx('role_source');
  v_role_field text := pg_temp.ctx('role_field');
  v_iv_a uuid := pg_temp.uid('iv_a');
  v_ra uuid := pg_temp.uid('ra');
  v_c1 uuid := pg_temp.uid('c1');
  v_emp_a uuid := pg_temp.uid('emp_a');
  v_key text; v_uid uuid; v_role text; v_expected text;
  v_reach int; v_err_reach text;
  v_upd int; v_err_upd text;
  v_err_ins text;
  v_url_after text;
begin
  foreach v_key in array array['source', 'field'] loop
    v_uid := case v_key when 'source' then v_uid_source else v_uid_field end;
    v_role := case v_key when 'source' then v_role_source else v_role_field end;
    v_expected := case v_key when 'source' then 'source_country' else 'field_officer' end;
    v_reach := 0; v_err_reach := null; v_upd := 0; v_err_upd := null; v_err_ins := null;

    if coalesce(v_role, '') <> v_expected then
      perform pg_temp.rec('1-' || v_key, format('%s görüşme bağlantısı ekleyemez', v_key), null,
        format('hesabın rolü "%s", beklenen "%s"', v_role, v_expected));
      continue;
    end if;

    -- a) Same officer, another column: proves RLS lets them reach the row.
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_uid::text, true);
      set local role authenticated;
      update public.interviews set panova_notes = 'TEST bağlantı not' where id = v_iv_a;
      get diagnostics v_reach = row_count;
      reset role;
    exception when others then
      v_err_reach := sqlerrm;
    end;
    reset role;

    -- b) Set the link on an existing interview.
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_uid::text, true);
      set local role authenticated;
      update public.interviews set meeting_url = 'https://meet.ornek.com/' || v_key where id = v_iv_a;
      get diagnostics v_upd = row_count;
      reset role;
    exception when others then
      v_err_upd := sqlerrm;
    end;
    reset role;

    -- c) Insert a new interview that carries a link.
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_uid::text, true);
      set local role authenticated;
      insert into public.interviews (request_id, candidate_id, employer_id, scheduled_at, status, is_demo, meeting_url)
      values (v_ra, v_c1, v_emp_a, now() + interval '2 days', 'scheduled', true, 'https://meet.ornek.com/yeni-' || v_key);
      reset role;
    exception when others then
      v_err_ins := sqlerrm;
    end;
    reset role;

    select meeting_url into v_url_after from public.interviews where id = v_iv_a;

    if v_reach <> 1 then
      perform pg_temp.rec('1-' || v_key, format('%s (%s) görüşme bağlantısı ekleyemez', v_key, v_expected), null,
        format('hesap test görüşmesine RLS ile ulaşamadı (diğer sütun güncellemesi: %s), kural sınanamadı',
          coalesce(v_err_reach, v_reach || ' satır')));
      continue;
    end if;

    perform pg_temp.rec('1-' || v_key, format('%s (%s) görüşme bağlantısı ekleyemez', v_key, v_expected),
      coalesce(v_err_upd, '') like '%meeting_url_role_not_allowed%'
        and coalesce(v_err_ins, '') like '%meeting_url_role_not_allowed%'
        and v_url_after is null
        and not exists (select 1 from public.interviews
                        where request_id = v_ra and meeting_url = 'https://meet.ornek.com/yeni-' || v_key),
      format('diğer_sütun=%s satır; güncelleme=%s; yeni_görüşme=%s; kayıttaki_bağlantı=%s',
        v_reach,
        coalesce(v_err_upd, 'HATA YOK (' || v_upd || ' satır)'),
        coalesce(v_err_ins, 'HATA YOK (eklendi)'),
        coalesce(v_url_after, 'boş')));
  end loop;
end $$;

-- 3. Scenario 2 + 3: Hedef Ülke and Üst Yönetim add it; javascript: rejected ---

do $$
declare
  v_uid_target uuid := pg_temp.uid('uid_target');
  v_uid_upper uuid := pg_temp.uid('uid_upper');
  v_role_target text := pg_temp.ctx('role_target');
  v_role_upper text := pg_temp.ctx('role_upper');
  v_iv_a uuid := pg_temp.uid('iv_a');
  v_ra uuid := pg_temp.uid('ra');
  v_c1 uuid := pg_temp.uid('c1');
  v_emp_a uuid := pg_temp.uid('emp_a');
  v_key text; v_uid uuid; v_role text; v_expected text; v_url text;
  v_upd int; v_err_upd text; v_err_ins text; v_new_id uuid;
  v_js_n int; v_js_state text; v_js_msg text;
  v_after text; v_after_js text; v_new_url text;
begin
  foreach v_key in array array['target', 'upper'] loop
    v_uid := case v_key when 'target' then v_uid_target else v_uid_upper end;
    v_role := case v_key when 'target' then v_role_target else v_role_upper end;
    v_expected := case v_key when 'target' then 'target_country' else 'upper_management' end;
    v_url := 'https://meet.ornek.com/' || v_key;
    v_upd := 0; v_err_upd := null; v_err_ins := null; v_new_id := null;
    v_js_n := 0; v_js_state := null; v_js_msg := null;

    if coalesce(v_role, '') <> v_expected then
      perform pg_temp.rec('2-' || v_key, format('%s görüşme bağlantısı ekler', v_key), null,
        format('hesabın rolü "%s", beklenen "%s"', v_role, v_expected));
      perform pg_temp.rec('3-' || v_key, format('%s: javascript: bağlantısı reddedilir', v_key), null,
        format('hesabın rolü "%s", beklenen "%s"', v_role, v_expected));
      continue;
    end if;

    -- 2a) Set the link on the existing interview.
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_uid::text, true);
      set local role authenticated;
      update public.interviews set meeting_url = v_url where id = v_iv_a;
      get diagnostics v_upd = row_count;
      reset role;
    exception when others then
      v_err_upd := sqlerrm;
    end;
    reset role;
    select meeting_url into v_after from public.interviews where id = v_iv_a;

    -- 2b) Insert a new interview with a link.
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_uid::text, true);
      set local role authenticated;
      insert into public.interviews (request_id, candidate_id, employer_id, scheduled_at, status, is_demo, meeting_url)
      values (v_ra, v_c1, v_emp_a, now() + interval '3 days', 'scheduled', true, v_url || '/yeni')
      returning id into v_new_id;
      reset role;
    exception when others then
      v_err_ins := sqlerrm;
    end;
    reset role;
    select meeting_url into v_new_url from public.interviews where id = v_new_id;

    perform pg_temp.rec('2-' || v_key, format('%s (%s) görüşme bağlantısı ekler ve değiştirir', v_key, v_expected),
      v_err_upd is null and v_upd = 1 and v_after = v_url
        and v_err_ins is null and v_new_url = v_url || '/yeni',
      format('güncelleme=%s; kayıttaki=%s; yeni_görüşme=%s%s',
        coalesce('HATA ' || v_err_upd, v_upd || ' satır'), coalesce(v_after, 'boş'),
        coalesce('HATA ' || v_err_ins, coalesce(v_new_url, 'bağlantı yok')),
        case when v_upd = 0 and v_err_upd is null
          then ' (ipucu: hesabın scope_country alanı boş ya da talebin ülkesiyle eşleşmiyor)' else '' end));

    -- 3) javascript: must fail on the check constraint (23514), not on RLS.
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', v_uid::text, true);
      set local role authenticated;
      update public.interviews set meeting_url = 'javascript:alert(1)' where id = v_iv_a;
      get diagnostics v_js_n = row_count;
      reset role;
    exception when others then
      v_js_state := sqlstate;
      v_js_msg := sqlerrm;
    end;
    reset role;
    select meeting_url into v_after_js from public.interviews where id = v_iv_a;

    perform pg_temp.rec('3-' || v_key, format('%s: javascript: bağlantısı reddedilir', v_key),
      v_js_state = '23514' and coalesce(v_js_msg, '') like '%interviews_meeting_url_check%'
        and v_after_js is not distinct from v_after,
      format('sonuç=%s; kayıttaki=%s',
        coalesce(v_js_state || ' ' || v_js_msg,
          case when v_js_n = 0 then '0 satır (RLS, kontrol edilemedi)' else 'KABUL EDİLDİ' end),
        coalesce(v_after_js, 'boş')));
  end loop;
end $$;

-- 4. Scenario 4: employer sees only its own link and cannot change it ---------

do $$
declare
  v_emp uuid := pg_temp.uid('uid_employer');
  v_iv_a uuid := pg_temp.uid('iv_a');
  v_iv_b uuid := pg_temp.uid('iv_b');
  v_before text;
  v_own_n int := -1; v_own_url text;
  v_other_n int := -1; v_other_url text;
  v_upd int := 0; v_err_upd text; v_err text;
  v_after text;
begin
  select meeting_url into v_before from public.interviews where id = v_iv_a;

  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_emp, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_emp::text, true);
    set local role authenticated;
    select count(*), max(meeting_url) into v_own_n, v_own_url from public.interviews where id = v_iv_a;
    select count(*), max(meeting_url) into v_other_n, v_other_url from public.interviews where id = v_iv_b;
    reset role;
  exception when others then
    v_err := sqlerrm;
  end;
  reset role;

  perform pg_temp.rec('4a', 'İşveren kendi görüşmesinin bağlantısını görür, başka işverenin bağlantısını göremez',
    v_err is null and v_own_n = 1 and v_own_url is not distinct from v_before
      and v_other_n = 0 and v_other_url is null,
    format('kendi=%s satır (%s); başka_işveren=%s satır (%s); hata=%s',
      v_own_n, coalesce(v_own_url, 'bağlantı yok'), v_other_n, coalesce(v_other_url, 'görünmüyor'),
      coalesce(v_err, '-')));

  begin
    perform set_config('request.jwt.claims', json_build_object('sub', v_emp, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_emp::text, true);
    set local role authenticated;
    update public.interviews set meeting_url = 'https://evil.example/x' where id = v_iv_a;
    get diagnostics v_upd = row_count;
    reset role;
  exception when others then
    v_err_upd := sqlerrm;
  end;
  reset role;
  select meeting_url into v_after from public.interviews where id = v_iv_a;

  perform pg_temp.rec('4b', 'İşveren kendi görüşmesinin bağlantısını değiştiremez',
    (v_err_upd is not null or v_upd = 0) and v_after is not distinct from v_before,
    format('güncelleme=%s; kayıttaki=%s',
      coalesce(v_err_upd, v_upd || ' satır'), coalesce(v_after, 'boş')));
end $$;

-- 5. Results, then undo everything --------------------------------------------

select * from _results order by id;
rollback;
