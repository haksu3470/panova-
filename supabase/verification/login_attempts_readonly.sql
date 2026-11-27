-- ADIM 1 (salt okuma): login_attempts tablosu ve fonksiyonu henüz yok mu? Hiçbir şey değiştirmez.
select to_regclass('public.login_attempts') is null as tablo_yok,
       to_regprocedure('public.login_attempt_allowed(text,integer,integer)') is null as fonksiyon_yok;
