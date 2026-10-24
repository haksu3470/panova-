import { supabase } from '@/lib/supabase';

export const employerService = {
  // Tüm işverenleri getir
  async getAllEmployers() {
    const { data, error } = await supabase
      .from('employers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Tek bir işverenin detayını getir
  async getEmployerById(id: string) {
    const { data, error } = await supabase
      .from('employers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // İşveren bilgilerini güncelle
  async updateEmployer(id: string, payload: any) {
    const { error } = await supabase
      .from('employers')
      .update(payload)
      .eq('id', id);
    
    if (error) throw error;
  },

  // Yeni işveren ekle
  async createEmployer(payload: any) {
    const { data, error } = await supabase
      .from('employers')
      .insert([payload])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};