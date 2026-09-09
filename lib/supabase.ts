import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vptcihlhkzfmwxpaituf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwdGNpaGxoa3pmbXd4cGFpdHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NjE4MDAsImV4cCI6MjEwNDUzNzgwMH0.OGbzz6zi3alp54aRPheUv_S7x9JipH-erKLQlAEL_lA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);