import { supabase } from '@/lib/supabase';

/** İşlem geçmişini audit_logs tablosuna yazar (RLS: yalnızca staff insert). */
export async function writeAudit(action: string, entityType?: string, entityId?: string, details?: Record<string, unknown>) {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    await supabase.from('audit_logs').insert({
      action,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      details: details ?? null,
      actor_user_id: user?.id ?? null,
      actor_name: (user?.user_metadata?.full_name as string) || user?.email || null,
    });
  } catch (e) {
    console.error('audit write failed', e);
  }
}
