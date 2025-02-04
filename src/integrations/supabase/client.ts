import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://hlljirnsimcmmuuhaurs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsbGppcm5zaW1jbW11dWhhdXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5MDM1NzEsImV4cCI6MjA1MzQ3OTU3MX0.1Kl1-kaOsjVmjjYpUSaPEVmHLigSieurs2edfwYjuLk";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    }
  }
);