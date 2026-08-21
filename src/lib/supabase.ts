import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL: Supabase URL or Key missing from env vars!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Expose for debugging only - REMOVE in production if you want
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}

export default supabase;
