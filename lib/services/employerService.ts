import { supabase } from '@/lib/supabase';
import {
  EmployerWriteError,
  assertEmployerPersisted,
  companyProfilePayload,
  resolveLinkedEmployerId,
  type CompanyProfileInput,
  type EmployerRow,
} from '@/lib/employerProfile';

const EMPLOYER_COLUMNS = 'id, company_name, contact_person, email, phone, country, logo';

export const employerService = {
  async getAllEmployers() {
    const { data, error } = await supabase
      .from('employers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getEmployerById(id: string) {
    const { data, error } = await supabase
      .from('employers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * The employer for this session: profiles.linked_employer_id, otherwise the
   * row with auth_user_id = auth.uid(). Does not search by the form email.
   */
  async getMyEmployer(): Promise<EmployerRow> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw new EmployerWriteError('write_failed', userError.message);
    const user = userData.user;
    if (!user) throw new EmployerWriteError('not_linked', 'Not authenticated');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('linked_employer_id')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError) throw new EmployerWriteError('write_failed', profileError.message);

    let ownedId: string | null = null;
    if (!profile?.linked_employer_id) {
      const { data: owned, error: ownedError } = await supabase
        .from('employers')
        .select('id')
        .eq('auth_user_id', user.id)
        .limit(1);
      if (ownedError) throw new EmployerWriteError('write_failed', ownedError.message);
      ownedId = owned?.[0]?.id ?? null;
    }

    let id = resolveLinkedEmployerId({
      profileLinkedEmployerId: profile?.linked_employer_id,
      authOwnedEmployerId: ownedId,
    });

    if (!id) {
      const linked = await supabase.rpc('link_my_employer');
      if (linked.error || !linked.data) {
        throw new EmployerWriteError('not_linked', linked.error?.message || 'No linked employer');
      }
      id = String(linked.data);
    }

    const { data, error } = await supabase
      .from('employers')
      .select(EMPLOYER_COLUMNS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new EmployerWriteError('write_failed', error.message);
    if (!data) throw new EmployerWriteError('not_linked', 'Linked employer is not visible');
    return data;
  },

  async updateEmployer(id: string, payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('employers')
      .update(payload)
      .eq('id', id)
      .select(EMPLOYER_COLUMNS)
      .maybeSingle();
    return assertEmployerPersisted(data, error);
  },

  async saveMyCompanyProfile(input: CompanyProfileInput, expectedId: string) {
    const mine = await this.getMyEmployer();
    if (mine.id !== expectedId) {
      throw new EmployerWriteError('not_linked', 'Loaded employer does not match the signed-in link');
    }
    return this.updateEmployer(mine.id, companyProfilePayload(input));
  },

  async createEmployer(payload: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('employers')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
