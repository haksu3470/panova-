import { supabase } from '@/lib/supabase';

export const supplierService = {
  // Tüm tedarikçileri getir
  async getAllSuppliers() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Tek bir tedarikçinin detayını getir
  async getSupplierById(id: string) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Tedarikçi bilgilerini güncelle
  async updateSupplier(id: string, payload: any) {
    const { error } = await supabase
      .from('suppliers')
      .update(payload)
      .eq('id', id);
    
    if (error) throw error;
  },

  // Yeni tedarikçi ekle
  async createSupplier(payload: any) {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([payload])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};