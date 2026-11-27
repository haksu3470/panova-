-- Document access check for the portal downloads and PDFs (PR #142).
-- Who can reach whose document: own candidate yes, another candidate no,
-- an employer no, anon no; employer candidate list = own presented matches.
--
-- NOTHING IS KEPT: begin; ... rollback;  No insert, update or delete on real
-- tables. Run in the Supabase SQL Editor as postgres.
--
-- Accounts are picked from existing data (no e-mail needed):
--   A = a candidate with a login and at least one document with a file
--   B = another candidate with a login
--   E = an employer with a login
-- Each is impersonated with set local role + request.jwt.claims.
-- Output: the last statement returns the result table; each row GEÇTİ / KALDI /
-- YAPILAMADI (no suitable account in the data).

begin;

create temp table _ctx (k text primary key, v text) on commit drop;
create temp table _results (id serial, n text, senaryo text, sonuc text, ayrinti text) on commit drop;
-- Same columns as the employer list, filled while impersonating the employer below.
create temp table _browse on commit drop as select * from public.employer_browse_candidates() limit 0;
grant insert, select on _browse to authenticated;

create function pg_temp.v(p_k text) returns text language sql as $$ select v from _ctx where k = p_k $$;
create function pg_temp.rec(p_n text, p_s text, p_ok boolean, p_d text) returns void language sql as $$
  insert into _results (n, senaryo, sonuc, ayrinti)
  values (p_n, p_s, case when p_ok is null then 'YAPILAMADI' when p_ok then 'GEÇTİ' else 'KALDI' end, p_d)
$$;

-- 1. Accounts (as postgres) -----------------------------------------------------
do $$
declare
  v_a uuid; v_a_uid uuid; v_doc uuid; v_path text;
  v_b uuid; v_b_uid uuid;
  v_e uuid; v_e_uid uuid;
begin
  select c.id, c.auth_user_id, d.id, o.name
    into v_a, v_a_uid, v_doc, v_path
  from public.job_candidates c
  join public.candidate_documents d on d.candidate_id = c.id
  left join storage.objects o on o.bucket_id = 'candidate-files' and split_part(o.name, '/', 1) = c.id::text
  where c.auth_user_id is not null and d.file_url is not null and d.file_url <> ''
  order by (o.name is null), c.created_at
  limit 1;

  select c.id, c.auth_user_id into v_b, v_b_uid
  from public.job_candidates c
  where c.auth_user_id is not null and c.id is distinct from v_a
  limit 1;

  select e.id, e.auth_user_id into v_e, v_e_uid
  from public.employers e
  where e.auth_user_id is not null
  order by (exists (select 1 from public.job_requests r where r.employer_id = e.id)) desc
  limit 1;

  insert into _ctx values
    ('a', v_a::text), ('a_uid', v_a_uid::text), ('doc', v_doc::text), ('path', v_path),
    ('b_uid', v_b_uid::text), ('e', v_e::text), ('e_uid', v_e_uid::text);
end $$;

-- 2. Checks, one impersonation each -------------------------------------------
create function pg_temp.as_user(p_uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

do $$
declare
  a text := pg_temp.v('a'); doc text := pg_temp.v('doc'); path text := pg_temp.v('path');
  n int; ok boolean; err text;
begin
  -- A: own documents (sanity: the check is real, not empty everywhere)
  if pg_temp.v('a_uid') is null then
    perform pg_temp.rec('1', 'Aday kendi belgelerini görür', null, 'girişli ve belgeli aday yok');
  else
    perform pg_temp.as_user(pg_temp.v('a_uid'));
    select count(*) into n from public.candidate_documents where candidate_id = a::uuid;
    reset role;
    perform pg_temp.rec('1', 'Aday kendi belgelerini görür', n > 0, n || ' belge');
    if path is not null then
      perform pg_temp.as_user(pg_temp.v('a_uid'));
      select count(*) into n from storage.objects where bucket_id = 'candidate-files' and name = path;
      reset role;
      perform pg_temp.rec('2', 'Aday kendi dosyasını depoda görür', n = 1, path);
    end if;
    begin
      perform pg_temp.as_user(pg_temp.v('a_uid'));
      err := public.log_document_access(doc::uuid);
      reset role;
      ok := err is not null;
    exception when others then
      reset role;
      ok := false; err := sqlerrm;
    end;
    perform pg_temp.rec('2b', 'Aday kendi belgesinin indirme adresini alır', ok, coalesce(err, 'boş'));
  end if;

  -- B and E: no row, no file, no download address for A's document
  for i in 1..2 loop
    declare
      who text := case i when 1 then 'Başka aday' else 'İşveren' end;
      uid text := pg_temp.v(case i when 1 then 'b_uid' else 'e_uid' end);
      p text := case i when 1 then '3' else '6' end;
    begin
      if uid is null or a is null then
        perform pg_temp.rec(p, who || ': A''nın belgeleri', null, 'uygun hesap yok');
        continue;
      end if;
      perform pg_temp.as_user(uid);
      select count(*) into n from public.candidate_documents where candidate_id = a::uuid;
      reset role;
      perform pg_temp.rec(p || 'a', who || ' A''nın belge satırlarını göremez', n = 0, n || ' satır');

      if path is null then
        perform pg_temp.rec(p || 'b', who || ' A''nın dosyasını depoda göremez', null, 'A''nın depoda dosyası yok');
      else
        perform pg_temp.as_user(uid);
        select count(*) into n from storage.objects where bucket_id = 'candidate-files' and name = path;
        reset role;
        perform pg_temp.rec(p || 'b', who || ' A''nın dosyasını depoda göremez (imzalı link alamaz)', n = 0, n || ' dosya');
      end if;

      begin
        perform pg_temp.as_user(uid);
        perform public.log_document_access(doc::uuid);
        reset role;
        ok := false; err := 'hata vermedi';
      exception when others then
        reset role;
        ok := sqlerrm ilike '%forbidden%'; err := sqlerrm;
      end;
      perform pg_temp.rec(p || 'c', who || ' A''nın belgesi için indirme adresi alamaz', ok, err);
    end;
  end loop;

  -- E: candidate list only from own requests' presented matches, no secret columns
  if pg_temp.v('e_uid') is not null then
    perform pg_temp.as_user(pg_temp.v('e_uid'));
    insert into _browse select * from public.employer_browse_candidates();
    reset role;
    select count(*) into n from _browse b
    where not exists (
      select 1 from public.request_matches m join public.job_requests r on r.id = m.request_id
      where m.id = b.match_id and r.employer_id = pg_temp.v('e')::uuid and m.presented_at is not null
    );
    perform pg_temp.rec('7', 'İşveren aday listesi yalnız kendi taleplerine sunulanlar', n = 0,
      (select count(*) from _browse) || ' satır, yabancı: ' || n);
    select count(*) into n from regexp_split_to_table(pg_get_function_result('public.employer_browse_candidates()'::regprocedure), ',') col
    where col ~* '(passport|phone|email|file_url|document|birth|address)';
    perform pg_temp.rec('8', 'İşveren aday listesinde pasaport/telefon/e-posta/dosya yok', n = 0, n || ' hassas kolon');
  end if;

  -- anon: nothing
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    select count(*) into n from public.candidate_documents;
    ok := n = 0; err := n || ' satır';
  exception when insufficient_privilege then ok := true; err := 'yetki yok';
  end;
  reset role;
  perform pg_temp.rec('9', 'Girişsiz kullanıcı hiçbir belge satırı göremez', ok, err);
  set local role anon;
  select count(*) into n from storage.objects where bucket_id = 'candidate-files';
  reset role;
  perform pg_temp.rec('10', 'Girişsiz kullanıcı depoda hiçbir aday dosyası göremez', n = 0, n || ' dosya');
end $$;

select n as "no", senaryo, sonuc, ayrinti from _results order by id;

rollback;
