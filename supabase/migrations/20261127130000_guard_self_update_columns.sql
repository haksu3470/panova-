-- Aday ve işveren kendi satırında yalnız profil ekranındaki alanları değiştirebilsin.
-- Sorun: cand_self_update / emp_self_update tüm sütunlara izin veriyor. İşveren kendi
-- compliance_status, suitability_status, notes, assigned_to, is_demo, archived_at alanlarını;
-- aday is_verified, notes, assigned_to, is_demo, archived_at, kvkk_* ve süreç ayrıntılarını
-- (pnr_code, flight_number, equivalence_status ...) değiştirebiliyordu.
-- Sütun yetkisi (grant update (...)) kullanılamaz: personel de aynı 'authenticated' rolüyle yazıyor.
-- Bu yüzden tetikleyici: istek doğrudan uygulamadan (current_user anon/authenticated) gelir ve
-- çağıran personel değilse, izinli listenin dışındaki bir alan değişirse hata verir.
-- SECURITY INVOKER: link_my_candidate, staff_* gibi security definer fonksiyonlar sahip
-- rolüyle çalıştığı için etkilenmez.
-- İzinli alanlar uygulamadaki tek yazma yerlerinden alındı:
--   aday:    app/candidate/page.tsx handleUpdateProfile (candidateRegistrationPayload, email, photo_url, documents_json)
--   işveren: lib/employerProfile.ts companyProfilePayload
-- Video alanları kendi tetikleyicisinde (guard_candidate_youtube_video) korunuyor, burada dokunulmaz.
-- Satır değişmez; yedek tablo gerekmez.
-- Sıra: supabase/verification/self_update_columns_readonly.sql -> bu dosya
--       -> supabase/verification/guard_self_update_columns.sql
-- Geri alma: supabase/rollback/20261127130000_guard_self_update_columns_rollback.sql
begin;

create or replace function public.guard_self_update_columns()
returns trigger
language plpgsql
security invoker
set search_path to ''
as $$
declare
  v_allowed text[];
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if public.is_staff() then
    return new;
  end if;
  if tg_table_name = 'job_candidates' then
    v_allowed := array['full_name', 'passport_number', 'phone', 'profession', 'sector', 'nationality',
                       'email', 'photo_url', 'documents_json', 'updated_at',
                       'video_url', 'video_url_1', 'video_url_2', 'video_url_3'];
  else
    v_allowed := array['company_name', 'contact_person', 'email', 'phone', 'country', 'logo', 'updated_at'];
  end if;
  if (to_jsonb(new) - v_allowed) is distinct from (to_jsonb(old) - v_allowed) then
    raise exception 'self_update_column_forbidden' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_self_update_columns() from public, anon, authenticated;

drop trigger if exists job_candidates_guard_self_update on public.job_candidates;
create trigger job_candidates_guard_self_update
  before update on public.job_candidates
  for each row execute function public.guard_self_update_columns();

drop trigger if exists employers_guard_self_update on public.employers;
create trigger employers_guard_self_update
  before update on public.employers
  for each row execute function public.guard_self_update_columns();

commit;
