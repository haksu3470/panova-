-- İletişim formu (ana sayfa + /tarim) için veritabanı tarafında sınır.
-- Sorun: istek sınırı yok; contact_submissions'a anon INSERT 'with check (true)' olduğu için
-- REST API ile /api/contact atlanarak da sınırsız kayıt eklenebiliyor (veritabanı dolar,
-- her kayıt şirket kutusuna bildirim üretir).
-- Çözüm: her eklemede çalışan tetikleyici. Hem /api/contact hem doğrudan REST yolu için geçerli.
--   * aynı e-posta: 10 dakikada en fazla 3 kayıt
--   * tüm form: 1 saatte en fazla 20 kayıt
-- Aşılırsa 'contact_rate_limited' hatası; /api/contact bunu 429 olarak döner.
-- Uzunluk sınırları lib/email/contact-notification.ts LIMITS ile aynı (NOT VALID: yalnız yeni kayıtlar).
-- Satır değişmez; yedek tablo gerekmez.
-- Sıra: supabase/verification/contact_throttle_readonly.sql -> bu dosya
--       -> supabase/verification/contact_submission_throttle.sql
-- Geri alma: supabase/rollback/20261127140000_contact_submission_throttle_rollback.sql
begin;

create or replace function public.contact_submission_throttle()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  -- Aynı anda gelen iki isteğin ikisi de sayımı geçmesin.
  perform pg_catalog.pg_advisory_xact_lock(hashtext('contact_submission_throttle'));
  if (select count(*) from public.contact_submissions c
      where lower(c.email) = lower(new.email)
        and c.created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'contact_rate_limited' using errcode = 'P0001';
  end if;
  if (select count(*) from public.contact_submissions c
      where c.created_at > now() - interval '1 hour') >= 20 then
    raise exception 'contact_rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.contact_submission_throttle() from public, anon, authenticated;

drop trigger if exists contact_submissions_throttle on public.contact_submissions;
create trigger contact_submissions_throttle
  before insert on public.contact_submissions
  for each row execute function public.contact_submission_throttle();

alter table public.contact_submissions
  add constraint contact_submissions_lengths check (
    length(full_name) <= 120
    and length(email) <= 254
    and coalesce(length(phone), 0) <= 40
    and coalesce(length(company_name), 0) <= 160
    and coalesce(length(company_key), 0) <= 40
    and coalesce(length(notes), 0) <= 4000
  ) not valid;

commit;
