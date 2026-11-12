'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isUpperManagementRole } from '@/lib/staffAccess';

export function useStaffRole() {
  const [state, setState] = useState({ role: '', upper: false, ready: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        if (alive) setState({ role: '', upper: false, ready: true });
        return;
      }
      const { data: staff } = await supabase
        .from('staff_members')
        .select('role_level')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      let role = String(staff?.role_level || '').toLowerCase();
      if (!role) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('staff_role')
          .eq('id', user.id)
          .maybeSingle();
        role = String(profile?.staff_role || '').toLowerCase();
      }
      if (alive) setState({ role, upper: isUpperManagementRole(role), ready: true });
    })();
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
