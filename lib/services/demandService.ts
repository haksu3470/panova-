import { supabase } from '@/lib/supabase';

export const demandService = {
  // Tüm iş taleplerini getir
  async getAllDemands() {
    const { data, error } = await supabase
      .from('job_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Tek bir talebin detayını getir
  async getDemandById(id: string) {
    const { data, error } = await supabase
      .from('job_requests')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },
};
