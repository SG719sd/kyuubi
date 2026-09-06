import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

const FALLBACK_SUPABASE_URL = 'https://memjlrhljifrwjqyymil.supabase.co';
const FALLBACK_SUPABASE_KEY = 'placeholder-anon-key';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_KEY
  );
}