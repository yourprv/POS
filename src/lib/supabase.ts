import { createClient } from '@supabase/supabase-js';

// Read Supabase config strictly from environment variables provided to Vite.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Warn in dev if keys are missing; client may still be created for tests but will likely fail.
  // Do NOT embed service-role keys here.
  // eslint-disable-next-line no-console
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Supabase client may not function correctly.');
}

export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '', { auth: { persistSession: false } });

// Health check: verify we can read from a small, safe table the app uses for auth.
// Use `local_users` because this project manages app users there (not Supabase Auth).
export async function ping(): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return false;
  try {
    const { error } = await supabase.from('local_users').select('id').limit(1);
    return error == null;
  } catch (err) {
    return false;
  }
}

export default supabase;
