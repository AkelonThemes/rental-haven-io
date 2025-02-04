import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = 'https://hlljirnsimcmmuuhaurs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsbGppcm5zaW1jbW11dWhhdXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk2NzE5NzAsImV4cCI6MjAyNTI0Nzk3MH0.Ij9XQp4oGDjmfwBJ1FV_k_UBKD8Iu_H7Gg0Qz3QSQD4';

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'supabase.auth.token'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web',
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    }
  }
);