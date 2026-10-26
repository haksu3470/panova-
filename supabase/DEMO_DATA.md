# Demo veri / Demo data

- İş tablolarında `is_demo boolean not null default false` kolonu var. Demo kayıtlar `is_demo = true`.
- Canlıya geçişte tüm demo kayıtları silmek için (Supabase SQL Editor veya personel oturumuyla RPC):

```sql
select public.wipe_demo_data();   -- silinen satır sayılarını jsonb olarak döner
```

- Sadece personel (`is_staff()`) veya service_role çağırabilir. Auth kullanıcılarına ve gerçek (Auth'a bağlı) personele dokunmaz.
- Portal listelerinde demo kayıtlar sarı **Demo** rozeti ile görünür.
