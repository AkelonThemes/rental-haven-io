import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = 'https://hlljirnsimcmmuuhaurs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsbGppcm5zaW1jbW11dWhhdXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5MDM1NzEsImV4cCI6MjA1MzQ3OTU3MX0.1Kl1-kaOsjVmjjYpUSaPEVmHLigSieurs2edfwYjuLk';

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