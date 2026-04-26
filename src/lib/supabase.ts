import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Only initialize if we have a valid URL string starting with http
const isValidUrl = typeof supabaseUrl === 'string' && supabaseUrl.startsWith('http');
const hasKey = typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 0;

export const supabase = (isValidUrl && hasKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
