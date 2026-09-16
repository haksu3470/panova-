-- 1. Adaylar Tablosuna Model İhtiyaçlarına Uygun Yeni Alanlar Ekleme
ALTER TABLE job_candidates 
ADD COLUMN IF NOT EXISTS certificate_no TEXT,
ADD COLUMN IF NOT EXISTS issuing_body TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS equivalence_status TEXT DEFAULT 'ready', -- 'ready', 'evaluating', 'exam_required', 'completed'
ADD COLUMN IF NOT EXISTS expected_salary NUMERIC,
ADD COLUMN IF NOT EXISTS shift_suitable BOOLEAN DEFAULT true;

-- 2. 30-60-90 Gün Takip ve Değerlendirme Tablosu
CREATE TABLE IF NOT EXISTS placement_followups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  candidate_id UUID REFERENCES job_candidates(id) ON DELETE CASCADE,
  employer_name TEXT NOT NULL,
  period_stage TEXT NOT NULL, -- 'week_1', 'day_30', 'day_60', 'day_90', 'month_6', 'month_12'
  compliance_score INT CHECK (compliance_score BETWEEN 1 AND 5),
  salary_compliance BOOLEAN DEFAULT true,
  accommodation_compliance BOOLEAN DEFAULT true,
  notes TEXT
);

-- RLS Güvenlik İzinleri
ALTER TABLE placement_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select followups" ON placement_followups FOR SELECT USING (true);
CREATE POLICY "Allow public insert followups" ON placement_followups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update followups" ON placement_followups FOR UPDATE WITH CHECK (true);
