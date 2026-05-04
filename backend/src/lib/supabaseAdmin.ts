import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Client serveur avec service-role : ne JAMAIS l'exposer côté frontend.
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
