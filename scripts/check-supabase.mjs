import { createClient } from '@supabase/supabase-js';
import { performance } from 'perf_hooks';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vgventkqdwzzyxkdughg.supabase.co';
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZndmVudGtxZHd6enl4a2R1Z2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxODAxMjgsImV4cCI6MjEwNTc1NjEyOH0.XC7JxQtlnOY32xxptt5rkLYASrOuG1R4RLi37eSbb4o';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('\n======================================================');
  console.log('       BUS SAHAYI - SUPABASE CONNECTIVITY CHECK       ');
  console.log('======================================================');
  console.log(`Endpoint URL : ${supabaseUrl}`);
  console.log(`Timestamp    : ${new Date().toISOString()}\n`);

  let allHealthy = true;

  // 1. REST & Table Read Connectivity
  console.log('--- Checking REST / PostgREST Tables ---');
  const tables = ['complaints', 'depots', 'buses', 'routes', 'users', 'notifications'];
  const t0 = performance.now();

  for (const table of tables) {
    const startTbl = performance.now();
    const { data, error, status } = await supabase.from(table).select('*').limit(1);
    const ms = Math.round(performance.now() - startTbl);

    if (error) {
      console.log(`  [FAIL] Table "${table}": Status ${status} - ${error.message} (${ms}ms)`);
      allHealthy = false;
    } else {
      console.log(`  [OK]   Table "${table}": Status ${status} - Accessible (${ms}ms)`);
    }
  }

  // 2. Auth Service (GoTrue)
  console.log('\n--- Checking Supabase Auth Service ---');
  const tAuth = performance.now();
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  const authMs = Math.round(performance.now() - tAuth);

  if (sessionErr) {
    console.log(`  [FAIL] Auth Session API: ${sessionErr.message} (${authMs}ms)`);
    allHealthy = false;
  } else {
    console.log(`  [OK]   Auth API Online (${authMs}ms)`);
  }

  // 3. Realtime WebSocket Subscription
  console.log('\n--- Checking Supabase Realtime WebSockets ---');
  const tWs = performance.now();
  const wsResult = await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ ok: false, error: 'Subscription timed out after 5000ms' });
    }, 5000);

    const ch = supabase.channel(`cli_check_${Date.now()}`);
    ch.subscribe((state, err) => {
      if (state === 'SUBSCRIBED') {
        clearTimeout(timeout);
        const wsMs = Math.round(performance.now() - tWs);
        supabase.removeChannel(ch);
        resolve({ ok: true, latencyMs: wsMs });
      } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT') {
        clearTimeout(timeout);
        supabase.removeChannel(ch);
        resolve({ ok: false, error: err?.message || state });
      }
    });
  });

  if (wsResult.ok) {
    console.log(`  [OK]   Realtime WebSocket Channel Subscribed (${wsResult.latencyMs}ms)`);
  } else {
    console.log(`  [FAIL] Realtime WebSocket: ${wsResult.error}`);
    allHealthy = false;
  }

  console.log('\n======================================================');
  if (allHealthy) {
    console.log('  STATUS: ALL SUPABASE CONNECTIVITY CHECKS PASSED [OK] ');
  } else {
    console.log('  STATUS: ONE OR MORE CHECKS FAILED                   ');
  }
  console.log('======================================================\n');

  process.exit(allHealthy ? 0 : 1);
}

run().catch((err) => {
  console.error('Fatal connectivity error:', err);
  process.exit(1);
});
