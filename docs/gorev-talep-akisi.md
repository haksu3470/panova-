# Görev: Talep akışı düzeltmesi (talep-akisi dalı)

Proje: Next.js (app router) + Supabase. panovagroup.org: aday, işveren ve yönetim portalları.
Önceki bir araç bu işi yarım bıraktı. Kodun nerede kaldığını bulup devam edeceğiz.

## 1. Önce hiçbir dosyayı DEĞİŞTİRME

1. `git status`, `git diff --stat` ve `git log -5` ile durumu özetle. Yerel dalın `origin/main` gerisinde olup olmadığına bak (`git fetch origin` çalıştırabilirsin).
2. Aşağıdaki hedeflerin kodda nereye kadar yapıldığını bul.
3. Veritabanı şemasını oku (`supabase/migrations`, tip dosyaları) ve ilgili tabloları listele.
4. Dosya ve SQL değişikliklerini, riskleriyle birlikte kısa bir plan olarak sun ve **onayımı bekle**.

## 2. Kurallar

- `.env` ve anahtar dosyalarını okuma, çıktıya yazma.
- SQL değişikliklerini yalnız `supabase/migrations` altına dosya olarak yaz; veritabanına kendin uygulama.
- Arayüz metinlerini `dictionary.ts` üzerinden ekle (tüm dillerde).
- Küçük adımlarla ilerle; her adımdan sonra build ve lint çalıştır.
- Her adım bitince değişiklikleri özetle; ben onaylayınca commit edilecek.

## 3. Hedefler

1. İşverenin "Seç" butonu seçimi gerçekten kaydetsin.
2. Kartlardaki sayılar o talebe göre hesaplansın.
3. İşlem Durumu, Seyahat Bilgilerim ve Aktif Çalışanlar sekmeleri canlı veriyle dolsun.
4. Personel görüşmeye bir bağlantı ekleyebilsin, işveren "Mülakata Katıl" ile ona ulaşsın.
5. Talebin durumu, girilen kayıtlara göre kendiliğinden ilerlesin.

## 4. Tasarım önerisi (tek doğruluk kaynağı)

- **Seç düğmesi:** `request_matches` tablosuna `employer_decision` (pending, selected, rejected), `decided_at`, `decided_by` alanları. İşveren yalnız kendi firmasının eşleşmesini bir RPC ile günceller; yönetim sayaçları aynı alandan okur.
- **Kart sayıları:** Her talep için tek bir görünüm (view): eşleşen, sunulan, seçilen, görüşme, teklif, işlemde, seyahat hazır, işe başlayan. İşveren ve yönetim aynı görünümü kullanır.
- **Görüşme bağlantısı:** `interviews.meeting_url` ve `scheduled_at` (saat dilimiyle). Personel girer, işveren "Mülakata Katıl" ile açar. Yalnız http/https bağlantı kabul edilir.
- **İşlem Durumu, Seyahat, Aktif Çalışanlar:** Seçilen adayın süreç ve seyahat kayıtlarından okunur; sabit (hardcode) veri olmaz.
- **Talep durumu:** El ile seçilen liste yerine eşleşme ve süreç verisinden türetilir. Örnek: sunulan > 0 ise "Adaylar sunuluyor"; seçilen = kişi sayısı ise "Seçim tamamlandı". El ile geçersiz kılma yalnız Üst Yönetim'de olur ve audit'e yazılır.

## 5. Kabul kriterleri (test listesi)

- İşveren "Seç" der, sayfayı yeniler: seçim kalır; yönetim ekranında aynı seçim görünür.
- İşveren başka bir işverenin eşleşmesini seçemez veya değiştiremez (RLS ve RPC kontrolü).
- Kart sayıları işveren ve yönetimde aynıdır; kart başına doğru hesaplanır.
- İşlem Durumu, Seyahat Bilgilerim ve Aktif Çalışanlar gerçek kayıtları gösterir; kayıt yoksa net bir boş durum mesajı çıkar.
- Personel görüşme bağlantısı ekler; işveren "Mülakata Katıl" ile açar; bağlantısız görüşmede düğme görünmez.
- Talep durumu eşleşme, sunum, seçim ve süreç kayıtlarıyla kendiliğinden ilerler; geriye gitmez, tutarsız duruma düşmez.
- Tüm yeni metinler `dictionary.ts` üzerinden gelir; TR dışı dillerde İngilizce kalıntı yok.
- Build ve lint hatasız geçer.
