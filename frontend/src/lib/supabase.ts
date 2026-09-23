import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-anavandi-supabase.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Check if Supabase client is configured with real production credentials
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !import.meta.env.VITE_SUPABASE_URL.includes('demo-anavandi')
  );
};

/**
 * Check if mock data is explicitly enabled in environment
 */
export const isMockEnabled = (): boolean => {
  return import.meta.env.VITE_USE_MOCK === 'true';
};

/**
 * Supabase Auth Helpers
 */
export async function signUpWithSupabase(email: string, password: string, metadata?: Record<string, any>) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithSupabase(email: string, password: string) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOutSupabase() {
  if (!isSupabaseConfigured()) return;
  await supabase.auth.signOut();
}

/**
 * Supabase Storage / Table Operations for Complaints
 */
export async function fetchComplaintsFromSupabase() {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('complaints').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createComplaintInSupabase(complaintPayload: Record<string, any>) {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase.from('complaints').insert([complaintPayload]).select();
  if (error) throw error;
  return data?.[0];
}
