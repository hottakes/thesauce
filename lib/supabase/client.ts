'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Export type for external use
export type TypedSupabaseClient = ReturnType<typeof createClient>;

// Singleton for client-side usage
let browserClient: TypedSupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowserClient should only be used on the client');
  }
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}

// Export for backward compatibility with existing code
// Note: This should only be used in client components
export const supabase = createClient();
