import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://vgventkqdwzzyxkdughg.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZndmVudGtxZHd6enl4a2R1Z2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxODAxMjgsImV4cCI6MjEwNTc1NjEyOH0.XC7JxQtlnOY32xxptt5rkLYASrOuG1R4RLi37eSbb4o';

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
 * Supabase Operations for Complaints
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

export interface SupabaseHealthResult {
  ok: boolean;
  projectUrl: string;
  latencyMs: number;
  services: {
    rest: boolean;
    auth: boolean;
    realtime: boolean;
  };
  tables: Record<string, boolean>;
  error?: string;
}

/**
 * Diagnostic health check verifying REST, Auth, and Realtime WebSocket connectivity
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  const start = performance.now();
  const tables = ['complaints', 'depots', 'buses', 'routes', 'users', 'notifications'];
  const tableResults: Record<string, boolean> = {};

  try {
    // 1. Test database query (REST)
    const { status, error: restError } = await supabase.from('complaints').select('id').limit(1);
    const restOk = !restError && (status === 200 || status === 206);

    // 2. Test tables
    for (const t of tables) {
      const { error } = await supabase.from(t).select('*').limit(0);
      tableResults[t] = !error;
    }

    // 3. Test Auth
    const { error: authError } = await supabase.auth.getSession();
    const authOk = !authError;

    // 4. Test Realtime WebSocket
    const realtimeOk = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => resolve(false), 3500);
      const ch = supabase.channel(`health_${Date.now()}`);
      ch.subscribe((state) => {
        if (state === 'SUBSCRIBED') {
          clearTimeout(timeout);
          supabase.removeChannel(ch);
          resolve(true);
        } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') {
          clearTimeout(timeout);
          supabase.removeChannel(ch);
          resolve(false);
        }
      });
    });

    const latencyMs = Math.round(performance.now() - start);

    return {
      ok: restOk && authOk && realtimeOk,
      projectUrl: supabaseUrl,
      latencyMs,
      services: {
        rest: restOk,
        auth: authOk,
        realtime: realtimeOk,
      },
      tables: tableResults,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      projectUrl: supabaseUrl,
      latencyMs: Math.round(performance.now() - start),
      services: { rest: false, auth: false, realtime: false },
      tables: tableResults,
      error: (err as Error)?.message || 'Unknown connectivity failure',
    };
  }
}

