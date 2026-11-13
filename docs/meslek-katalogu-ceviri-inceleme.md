# Meslek kataloğu: çeviri inceleme listesi

Kaynak: `lib/professions.ts` (`SECTORS`, `PROFESSIONS`).

Aşağıdaki çevirilerden emin değilim. **Her dili ana dili konuşan biri gözden geçirsin.**
Düzeltme yalnız `labels` değerini değiştirir. Anahtar (`key`) değişmez, veritabanında anahtar saklanır.
Bir etiket iki farklı meslekte aynı olamaz, virgül de içeremez. `lib/professions.test.ts` bunu denetler.

## Makedonca (MK)

| Anahtar | TR | MK (şimdiki) | Kuşku |
| --- | --- | --- | --- |
| order_picker | Sipariş toplayıcı | Комисионер | Depo dilinde yerleşik mi, yoksa „Собирач на нарачки“ mı? |
| inventory_clerk | Envanter sayım elemanı | Попишувач | Seyrek kullanılan bir kelime. |
| reach_truck_operator | Reach truck operatörü | Оператор на ричтрак | Ödünç kelimenin yazımı |
| driver_mate | Şoför yardımcısı | Совозач | „Совозач“ ikinci şoför anlamına da gelebilir. |
| tailor | Terzi | Шивач по мерка | „Кројач“ zaten textile_cutter'da kullanılıyor. |
| textile_cutter | Kesimci | Кројач | Terzi ile karışabilir. |
| housekeeper | Kat görevlisi | Собарица | Kadın biçimi; nötr bir karşılık var mı? |
| childcare_worker | Çocuk bakıcısı | Негувателка на деца | Kadın biçimi |
| floor_layer | Zemin döşemecisi | Подополагач | Bu kelime kullanılıyor mu? |
| paramedic | Paramedik | Парамедицинар | Yerel kullanımı nedir? |
| merchandiser | Reyon düzenleyici | Мерчендајзер | Ödünç kelime |
| automotive (sektör) | Otomotiv ve teknik servis | Автомобилски и технички сервис | Kısa biçim yerinde mi? |

## Arnavutça (SQ)

| Anahtar | TR | SQ (şimdiki) | Kuşku |
| --- | --- | --- | --- |
| reach_truck_operator | Reach truck operatörü | Operator reach truck | Kelime çevrilmedi. |
| merchandiser | Reyon düzenleyici | Merçandajzer | Ödünç kelime |
| housekeeper | Kat görevlisi | Pastruese katësh | Otel dilinde yerleşik mi? |
| paramedic | Paramedik | Ndihmës mjekësor urgjence | Açıklayıcı bir çeviri |
| bookkeeper | Ön muhasebe elemanı | Kontabilist ndihmës | Doğru mu? |
| site_foreman | Şantiye formen | Kryepunëtor kantieri | Eski etiket „Shef kantieri“ artık site_manager'ın eski etiketi. |
| site_manager | Şantiye şefi | Drejtues kantieri | |
| dairy_worker | Süt sağım işçisi | Mjelës | |

## Arapça (AR)

| Anahtar | TR | AR (şimdiki) | Kuşku |
| --- | --- | --- | --- |
| reach_truck_operator | Reach truck operatörü | مشغّل رافعة ريتش | Ödünç kelime |
| site_foreman | Şantiye formen | مشرف عمال الموقع | Eski etiket „رئيس موقع“ artık site_manager'ın eski etiketi. |
| housekeeper | Kat görevlisi | عامل نظافة غرف | |
| caretaker | Apartman görevlisi | حارس عقار | Bölgeye göre değişir. |
| body_repairer | Kaportacı | سمكري سيارات | Bölgeye göre değişir. |
| merchandiser | Reyon düzenleyici | منسّق عرض المنتجات | |
| bookkeeper | Ön muhasebe elemanı | محاسب مساعد | |

## Sektör adları

Beş dildeki 11 sektör adının tamamına da bakılsın, özellikle MK `office_engineering` (uzun) ve SQ `warehouse_retail`.

## Eski talep formu pozisyonları

Eski formdaki 19 pozisyonun etiketleri `LEGACY_POSITIONS` içinde takma ad olarak kalıyor. Eski kayıtlar bu sayede okunabiliyor. Bunlar artık seçenek olarak gösterilmiyor; düzeltilmeleri gerekmiyor.
