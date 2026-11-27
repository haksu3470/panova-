-- Aday girişi (/api/auth/candidate-login) deneme sınırı veritabanında.
-- Sorun: sınır sunucu belleğindeydi; Vercel'de her örnekte ayrı ve soğuk başlatmada sıfır.
-- Çözüm: denemeler tabloda sayılır. Anahtar sunucuda SHA-256 ile özetlenir, kişisel veri saklanmaz.
-- Yalnız service_role çağırabilir; tabloda RLS açık ve politika yok (anon/authenticated erişemez).
-- Yeni nesneler; satır değişmez, yedek tablo gerekmez.
-- Sıra: supabase/verification/login_attempts_readonly.sql -> bu dosya
--       -> supabase/verification/login_attempts.sql
-- Geri alma: supabase/rollback/20261127150000_login_attempts_rollback.sql
begin;

create table if not exists public.login_attempts (
  key text not null,
  at timestamptz not null default now()
);
create index if not exists login_attempts_key_at on public.login_attempts (key, at);
create index if not exists login_attempts_at on public.login_attempts (at);
alter table public.login_attempts enable row level security;
revoke all on table public.login_attempts from public, anon, authenticated;

create or replace function public.login_attempt_allowed(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_count integer;
begin
  delete from public.login_attempts where at < now() - interval '1 day';
  insert into public.login_attempts (key) values (p_key);
  select count(*) into v_count from public.login_attempts
  where key = p_key and at > now() - make_interval(secs => p_window_seconds);
  return v_count <= p_max;
end;
$$;

revoke all on function public.login_attempt_allowed(text, integer, integer) from public, anon, authenticated;
grant execute on function public.login_attempt_allowed(text, integer, integer) to service_role;

commit;
