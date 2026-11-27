-- Mükerrer işveren kaydını engelle.
--   * e-posta: büyük/küçük harf ve baş/son boşluk duyarsız tekil (demo satırlar hariç)
--   * firma adı: public.employer_name_key ile normalize edilip tekil (demo satırlar hariç)
--   * public.employer_signup_conflict(email, company): kayıt formu için ön kontrol,
--     yalnız 'email' | 'company' | null döner (kişisel veri dönmez).
-- link_my_employer değişmez: insert tekil index'e takılırsa zaten
-- 'Employer already registered' hatası verir, form bunu yakalar.
--
-- Sıra: supabase/verification/employer_duplicates_readonly.sql (salt okuma, mükerrer 0 olmalı)
--       -> bu dosya (önce yedek tablo, sonra index) -> supabase/verification/employer_unique_email_company.sql
-- Geri alma: supabase/rollback/20261127100000_employer_unique_email_company_rollback.sql
-- Tek işlem: bir adım hata verirse hiçbir şey değişmez.

begin;

-- 0. Ön koşullar --------------------------------------------------------------
do $$
declare
  v_dup_email int;
  v_dup_name int;
begin
  if to_regclass('public.employers') is null then
    raise exception 'employer_unique: public.employers yok. Hiçbir şey değişmedi.';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'employers' and column_name = 'is_demo') then
    raise exception 'employer_unique: employers.is_demo yok. Hiçbir şey değişmedi.';
  end if;
  if to_regclass('public.employers_backup_20261127') is not null then
    raise exception 'employer_unique: yedek tablo zaten var (employers_backup_20261127). Önce kontrol edin. Hiçbir şey değişmedi.';
  end if;

  select count(*) into v_dup_email from (
    select 1 from public.employers
    where not coalesce(is_demo, false) and nullif(lower(btrim(email)), '') is not null
    group by lower(btrim(email)) having count(*) > 1) s;
  select count(*) into v_dup_name from (
    select 1 from public.employers
    where not coalesce(is_demo, false)
      and nullif(regexp_replace(translate(lower(coalesce(company_name, '')), 'ışğüöçâîû', 'isguocaiu'), '[^[:alnum:]]+', '', 'g'), '') is not null
    group by regexp_replace(translate(lower(coalesce(company_name, '')), 'ışğüöçâîû', 'isguocaiu'), '[^[:alnum:]]+', '', 'g')
    having count(*) > 1) s;
  if v_dup_email > 0 or v_dup_name > 0 then
    raise exception 'employer_unique: % mükerrer e-posta grubu, % mükerrer firma grubu var. Önce temizleyin. Hiçbir şey değişmedi.', v_dup_email, v_dup_name;
  end if;
end $$;

-- 1. Yedek tablo (yalnız yönetici/servis rolü okur) ---------------------------
create table public.employers_backup_20261127 as table public.employers;
alter table public.employers_backup_20261127 enable row level security;
revoke all on public.employers_backup_20261127 from anon, authenticated;

-- 2. Firma adı normalize anahtarı ---------------------------------------------
-- "ABC İnşaat Ltd. Şti." ve "abc insaat ltd sti" aynı anahtarı verir: abcinsaatltdsti
create or replace function public.employer_name_key(p_name text)
returns text
language sql
immutable
parallel safe
set search_path to ''
as $$
  select nullif(
    pg_catalog.regexp_replace(
      pg_catalog.translate(pg_catalog.lower(coalesce(p_name, '')), 'ışğüöçâîû', 'isguocaiu'),
      '[^[:alnum:]]+', '', 'g'),
    '');
$$;
revoke all on function public.employer_name_key(text) from public, anon;
grant execute on function public.employer_name_key(text) to authenticated;

-- 3. Tekil index'ler (demo satırlar hariç) ------------------------------------
create unique index employers_email_ci_unique
  on public.employers (lower(btrim(email)))
  where not is_demo and nullif(btrim(email), '') is not null;

create unique index employers_company_key_unique
  on public.employers (public.employer_name_key(company_name))
  where not is_demo and public.employer_name_key(company_name) is not null;

-- 4. Kayıt formu ön kontrolü --------------------------------------------------
-- Hesaba bağlanmamış (davet/personel açtığı) aynı e-postalı satır engel değildir:
-- link_my_employer onu sahiplenir, yeni satır açılmaz.
create or replace function public.employer_signup_conflict(p_email text, p_company text)
returns text
language plpgsql
stable
security definer
set search_path to ''
as $$
declare
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_key text := public.employer_name_key(p_company);
begin
  if length(coalesce(p_email, '')) > 320 or length(coalesce(p_company, '')) > 300 then
    return null;
  end if;
  if v_email is not null and exists (
    select 1 from public.employers
    where not is_demo and lower(btrim(email)) = v_email and auth_user_id is not null
  ) then
    return 'email';
  end if;
  if v_email is not null and exists (
    select 1 from public.employers
    where not is_demo and lower(btrim(email)) = v_email and auth_user_id is null
  ) then
    return null;
  end if;
  if v_key is not null and exists (
    select 1 from public.employers
    where not is_demo and public.employer_name_key(company_name) = v_key
  ) then
    return 'company';
  end if;
  return null;
end;
$$;
revoke all on function public.employer_signup_conflict(text, text) from public;
grant execute on function public.employer_signup_conflict(text, text) to anon, authenticated;

commit;

notify pgrst, 'reload schema';
