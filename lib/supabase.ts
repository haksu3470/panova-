import { createClient } from '@supabase/supabase-js';
import { captureRecoveryFromWindow } from '@/lib/passwordReset';
import { dropSessionIfNotRemembered } from '@/lib/remember';

captureRecoveryFromWindow();
dropSessionIfNotRemembered();

/**
 * Browser/server Supabase client. URL and anon key come only from env
 * (Vercel / local). No live project credentials are shipped in source.
 * Placeholders keep `createClient` happy at build time when env is unset;
 * they are not a real project and cannot open production data.
 */
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
export const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const validUrl = supabaseUrl.startsWith('http') ? supabaseUrl.replace(/\/$/, '') : '';

const clientUrl = validUrl || 'http://127.0.0.1';
const clientKey = supabaseAnonKey || 'missing-anon-key';

export const supabase = createClient(clientUrl, clientKey);
