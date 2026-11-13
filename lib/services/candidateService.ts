import { supabase } from '@/lib/supabase';
import { candidateStatusErrorKey, type CandidateStatusErrorKey } from '@/lib/candidateStatusChange';

export const candidateService = {
  // Tüm adayları getir
  async getAllCandidates() {
    const { data, error } = await supabase
      .from('job_candidates')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Tek bir adayın detayını getir
  async getCandidateById(id: string) {
    const { data, error } = await supabase
      .from('job_candidates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Aday durumu resmî süreçten otomatik türetilir. Elle değişiklik yalnız
  // Üst Yönetim içindir ve gerekçeyle staff_set_candidate_status üzerinden
  // yapılır (rolü, gerekçeyi ve geçişi veritabanı denetler).
  async setStatus(
    id: string,
    status: string,
    reason: string,
  ): Promise<{ status: string; errorKey: null } | { status: null; errorKey: CandidateStatusErrorKey }> {
    const { data, error } = await supabase.rpc('staff_set_candidate_status', {
      p_candidate_id: id,
      p_status: status,
      p_reason: reason,
    });
    if (error) return { status: null, errorKey: candidateStatusErrorKey(error) };
    return { status: typeof data === 'string' && data ? data : status, errorKey: null };
  },

  // Aday sorumlusunu güncelle
  async updateAssignee(id: string, assigned_to: string) {
    const { error } = await supabase
      .from('job_candidates')
      .update({ assigned_to })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Aday detaylarını (profil, belgeler, lojistik vb.) kaydet
  async updateCandidateDetail(id: string, payload: any) {
    const { error } = await supabase
      .from('job_candidates')
      .update(payload)
      .eq('id', id);
    
    if (error) throw error;
  }
};