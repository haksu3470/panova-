import { supabase } from '@/lib/supabase';

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

  // Aday durumunu güncelle
  async updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from('job_candidates')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
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