import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

let supabaseClient: SupabaseClient<Database> | null = null;

export function initSupabase(): SupabaseClient<Database> {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  console.log('[Supabase] Initializing client');
  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}

export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}
