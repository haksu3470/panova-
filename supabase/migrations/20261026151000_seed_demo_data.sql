-- Demo veri seti (tamamı is_demo = true). wipe_demo_data() ile tek seferde silinir.
do $$
declare
  e uuid[] := array[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  r uuid[] := array[gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid()];
  c uuid[] := array(select gen_random_uuid() from generate_series(1,12));
  names text[] := array['Ahmet Yılmaz','Mehmet Kaya','Rustam Karimov','Bekzod Tursunov','Ali Demir','Hasan Çelik','Nodir Aliyev','Murat Şahin','Ivan Petrov','Emre Aydın','Sardor Rahimov','Kemal Öztürk'];
  nats text[] := array['Türkiye','Türkiye','Özbekistan','Özbekistan','Türkiye','Türkiye','Özbekistan','Türkiye','Ukrayna','Türkiye','Özbekistan','Türkiye'];
  profs text[] := array['Kalıpçı','Elektrikçi','Kaynakçı','Demirci','Aşçı','Garson','Tır Şoförü','Sıhhi Tesisatçı','Kaynakçı','Elektrikçi','Kalıpçı','Aşçı'];
  secs text[] := array['construction','construction','construction','construction','hospitality','hospitality','logistics','construction','construction','construction','construction','hospitality'];
  sts text[] := array['pending','approved','approved','approved','approved','pending','approved','approved','approved','pending','approved','approved'];
  i int;
begin
  insert into employers (id, company_name, contact_name, contact_person, email, phone, country, city, assigned_sector, compliance_status, suitability_status, website, is_demo) values
   (e[1],'Demo Balkan İnşaat DOO','Marko Jovanović','Marko Jovanović','demo-balkan@example.com','+381 11 000 0001','Sırbistan','Belgrad','construction','approved','suitable','https://example.com',true),
   (e[2],'Demo Adriatik Otelcilik','Ana Horvat','Ana Horvat','demo-adriatik@example.com','+385 21 000 0002','Hırvatistan','Split','hospitality','approved','suitable','https://example.com',true),
   (e[3],'Demo Makedonya Yapı','Stefan Nikolovski','Stefan Nikolovski','demo-mk@example.com','+389 2 000 0003','Kuzey Makedonya','Üsküp','construction','pending','under_review','https://example.com',true),
   (e[4],'Demo TransEuro Lojistik','Petar Ilić','Petar Ilić','demo-transeuro@example.com','+381 21 000 0004','Sırbistan','Novi Sad','logistics','approved','suitable','https://example.com',true);

  insert into job_requests (id, employer_id, employer_name, sector, position_title, headcount, target_start_date, monthly_net_salary, working_hours, weekly_days, contract_type, accommodation_provided, food_provided, transport_provided, flight_covered, required_experience_years, required_language, status, city, country, is_demo) values
   (r[1],e[1],'Demo Balkan İnşaat DOO','construction','Kalıpçı',8,current_date+30,1300,'08:00-17:00','6','1 yıl',true,true,true,true,3,'Temel İngilizce','searching_candidates','Belgrad','Sırbistan',true),
   (r[2],e[1],'Demo Balkan İnşaat DOO','construction','Elektrikçi',4,current_date+45,1400,'08:00-17:00','5','1 yıl',true,false,true,true,5,'Temel İngilizce','presenting_candidates','Belgrad','Sırbistan',true),
   (r[3],e[2],'Demo Adriatik Otelcilik','hospitality','Aşçı',3,current_date+20,1200,'Vardiyalı','6','Sezonluk',true,true,false,true,2,'İngilizce','interviewing','Split','Hırvatistan',true),
   (r[4],e[3],'Demo Makedonya Yapı','construction','Kaynakçı',5,current_date+60,1350,'07:00-16:00','6','1 yıl',true,true,true,false,4,null,'searching_candidates','Üsküp','Kuzey Makedonya',true),
   (r[5],e[4],'Demo TransEuro Lojistik','logistics','Tır Şoförü (C+E)',6,current_date+40,1800,'Esnek','5','2 yıl',true,false,false,true,3,'Temel İngilizce','new','Novi Sad','Sırbistan',true),
   (r[6],e[2],'Demo Adriatik Otelcilik','hospitality','Garson',2,current_date-10,1000,'Vardiyalı','6','Sezonluk',true,true,false,true,1,'İngilizce','completed','Split','Hırvatistan',true);

  for i in 1..12 loop
    insert into job_candidates (id, full_name, nationality, phone, email, sector, profession, experience_years, status, city, birth_year, language_skills, expected_salary, shift_suitable, is_verified, official_process_status, is_demo)
    values (c[i], names[i], nats[i], '+90 555 000 00'||lpad(i::text,2,'0'), 'demo.aday'||i||'@example.com', secs[i], profs[i], 2+(i%8), sts[i],
            case when nats[i]='Türkiye' then 'İstanbul' else 'Taşkent' end, 1980+i, 'Temel İngilizce', 1100+i*50, i%2=0, sts[i]='approved',
            case when i in (1,5) then 'work_permit_applied' when i=6 then 'visa_approved' else null end, true);
  end loop;

  -- Eşleşmeler
  insert into request_matches (request_id, candidate_id, bound_at, presented_at, employer_result, notes, is_demo) values
   (r[1],c[1],now()-interval '10 days',now()-interval '7 days','selected','Demo: işveren seçti',true),
   (r[1],c[11],now()-interval '10 days',now()-interval '7 days','backup','Demo: yedek',true),
   (r[2],c[2],now()-interval '5 days',now()-interval '3 days','interview',null,true),
   (r[2],c[10],now()-interval '5 days',null,null,'Demo: sunum bekliyor',true),
   (r[3],c[5],now()-interval '8 days',now()-interval '6 days','selected',null,true),
   (r[3],c[12],now()-interval '8 days',now()-interval '6 days','not_suitable','Demo: dil yetersiz',true),
   (r[4],c[3],now()-interval '2 days',null,null,null,true),
   (r[4],c[9],now()-interval '2 days',null,null,null,true),
   (r[5],c[7],now()-interval '1 days',null,null,null,true),
   (r[6],c[6],now()-interval '60 days',now()-interval '55 days','selected',null,true);

  insert into interviews (request_id, candidate_id, employer_id, scheduled_at, status, result, employer_notes, is_demo) values
   (r[1],c[1],e[1],now()-interval '8 days','completed','selected','Tecrübeli, uygun',true),
   (r[2],c[2],e[1],now()+interval '2 days','scheduled',null,null,true),
   (r[3],c[5],e[2],now()-interval '6 days','completed','selected','Mutfak deneyimi iyi',true),
   (r[3],c[12],e[2],now()-interval '6 days','completed','not_suitable','İngilizce yetersiz',true);

  insert into candidate_documents (candidate_id, doc_type, status, uploaded_at, valid_until, is_demo)
  select c[g.k], d.t, d.s, now()-interval '5 days', case when d.t='passport' then current_date+ (365*3) else null end, true
  from generate_series(1,12) g(k),
  lateral (values ('passport', case when g.k%3=0 then 'pending' else 'approved' end),
                  ('cv', case when g.k%4=0 then 'reviewing' else 'approved' end),
                  ('certificate', case when g.k%5=0 then 'rerequested' when g.k%2=0 then 'uploaded' else 'approved' end)) d(t,s);

  insert into job_offers (candidate_id, employer_id, request_id, employer_name, position_title, monthly_net_salary, start_date, terms_details, status, is_demo) values
   (c[1],e[1],r[1],'Demo Balkan İnşaat DOO','Kalıpçı',1300,(current_date+30)::text,'Konaklama, yemek, ulaşım ve uçak bileti işverene ait','accepted',true),
   (c[5],e[2],r[3],'Demo Adriatik Otelcilik','Aşçı',1200,(current_date+20)::text,'Sezonluk sözleşme, konaklama dahil','pending',true),
   (c[6],e[2],r[6],'Demo Adriatik Otelcilik','Garson',1000,(current_date-10)::text,'Sezonluk','accepted',true);

  -- Seyahat / işe başlama
  update job_candidates set travel_status='ticketed', flight_date=(current_date+28)::text, flight_number='TK1083', departure_city='İstanbul', arrival_city='Belgrad', pnr_code='DEMO01', accommodation_details='Şantiye konaklaması, 2 kişilik oda', active_employer_id=e[1], active_request_id=r[1] where id=c[1];
  update job_candidates set travel_status='completed', flight_date=(current_date-12)::text, flight_number='TK1053', departure_city='İstanbul', arrival_city='Split', pnr_code='DEMO02', active_employer_id=e[2], active_request_id=r[6], official_process_status='started_work' where id=c[6];
  update job_candidates set active_employer_id=e[2], active_request_id=r[3] where id=c[5];

  insert into placement_followups (candidate_id, employer_id, request_id, employer_name, period_stage, check_date, compliance_score, salary_compliance, accommodation_compliance, employer_feedback, employee_feedback, notes, is_demo) values
   (c[6],e[2],r[6],'Demo Adriatik Otelcilik','30',current_date+18,null,null,null,null,null,'Demo: 30. gün kontrolü planlandı',true),
   (c[6],e[2],r[6],'Demo Adriatik Otelcilik','60',current_date+48,null,null,null,null,null,null,true),
   (c[6],e[2],r[6],'Demo Adriatik Otelcilik','90',current_date+78,null,null,null,null,null,null,true);

  insert into tasks (title, assignee, backup_assignee, due_date, status, related_entity_type, related_entity_id, description, is_demo) values
   ('Demo: Ahmet Yılmaz uçuş bilgilerini adaya ilet','Fatma','Mehmet',(current_date+3)::text,'pending','candidate',c[1],'Bilet kesildi, adaya bilgi verilecek',true),
   ('Demo: Elektrikçi talebi için mülakat organize et','Mehmet','Canan',(current_date+2)::text,'in_progress','request',r[2],null,true),
   ('Demo: Kaynakçı adaylarının sertifikalarını kontrol et','Canan','Fatma',(current_date+5)::text,'pending','request',r[4],null,true),
   ('Demo: Hasan Çelik 30. gün takibi','Aleksandar','Stefan',(current_date+18)::text,'pending','candidate',c[6],null,true),
   ('Demo: TransEuro sözleşme taslağı','Stefan','Aleksandar',(current_date-1)::text,'completed','employer',e[4],null,true);

  insert into candidate_notifications (candidate_id, title, message, type, is_read, audience, status, is_demo) values
   (c[1],'Uçuşunuz planlandı','Belgrad uçuşunuz TK1083 ile planlandı.','travel',false,'candidate','sent',true),
   (c[2],'Mülakat daveti','Elektrikçi pozisyonu için mülakatınız planlandı.','interview',false,'candidate','sent',true),
   (c[3],'Belge eksik','Pasaport belgenizi yükleyiniz.','document',true,'candidate','sent',true);

  insert into candidate_support_tickets (candidate_id, candidate_name, subject, message, status, category, employer_id, request_id, is_demo) values
   (c[6],'Hasan Çelik','Konaklama sorunu','Odada sıcak su yok.','open','accommodation',e[2],r[6],true),
   (c[5],'Ali Demir','Teklif sorusu','Sözleşme süresini netleştirebilir misiniz?','answered','offer',e[2],r[3],true);

  insert into audit_logs (actor_name, action, entity_type, entity_id, details, is_demo) values
   ('Demo Sistem','demo_seed','system',null,'{"note":"Demo veri seti yüklendi"}',true),
   ('Fatma','offer_accepted','job_offer',null,'{"candidate":"Ahmet Yılmaz"}',true),
   ('Mehmet','interview_scheduled','interview',null,'{"candidate":"Mehmet Kaya"}',true);
end $$;
