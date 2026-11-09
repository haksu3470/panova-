import { supabase } from '@/lib/supabase';
import { isStaff } from '@/lib/auth';
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

  async loadEmployerForPortal(staffViewId: string | null): Promise<EmployerRow> {
    if (staffViewId && await isStaff()) {
      const { data, error } = await supabase
        .from('employers')
        .select(EMPLOYER_COLUMNS)
        .eq('id', staffViewId)
        .maybeSingle();
      if (error) throw new EmployerWriteError('write_failed', error.message);
      if (!data) throw new EmployerWriteError('not_linked', 'Employer is not visible');
      return data;
    }
    return this.getMyEmployer();
  },

  async saveMyCompanyProfile(input: CompanyProfileInput, expectedId: string, options?: { staffView?: boolean }) {
    const payload = companyProfilePayload(input);
    let previousName: string | null = null;
    if (options?.staffView) {
      if (!(await isStaff())) throw new EmployerWriteError('not_linked', 'Staff view is not allowed');
      const { data: current } = await supabase.from('employers').select('company_name').eq('id', expectedId).maybeSingle();
      previousName = current?.company_name ?? null;
    } else {
      const mine = await this.getMyEmployer();
      if (mine.id !== expectedId) {
        throw new EmployerWriteError('not_linked', 'Loaded employer does not match the signed-in link');
      }
      previousName = mine.company_name;
    }
    const saved = await this.updateEmployer(expectedId, payload);
    if ((saved.company_name || '') !== payload.company_name) {
      throw new EmployerWriteError('write_failed', 'company_name was not stored');
    }
    if (previousName && previousName !== payload.company_name) {
      await supabase.from('job_requests').update({ employer_name: payload.company_name }).eq('employer_id', expectedId);
    }
    return saved;
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
