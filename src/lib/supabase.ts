import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Debug: expose supabase client globally for console inspection
if (typeof window !== 'undefined') {
  window.supabase = supabase;
}

export default supabase;
