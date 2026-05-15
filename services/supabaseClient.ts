// supabaseClient.ts — supabaseClient module.
//
// exports: getCachedSession | supabase | refreshAuthSession | clearSession | forceRefreshToken
// used_by: app\(tabs)\index.tsx
//         app\+not-found.tsx
//         app\auth\reset-password.tsx
//         app\confirm-email.tsx
//         app\feedback.tsx
//         app\forgot-password.tsx
//         app\password-reset-form.tsx
//         app\profile.tsx
//         context\AuthContext.tsx
//         context\ProductContext.tsx
//         context\__tests__\AuthContext.test.tsx
//         hooks\useRegistrationActions.ts
//         services\AuthService.ts
//         services\CategoryService.ts
//         services\IconLoader.ts
//         services\OneSignalService.ts
//         services\ProductStorage.ts
//         services\SettingsService.ts
//         services\TemplateService.ts
//         services\UserDeviceService.ts
//         services\UserNotificationSettingsService.ts
//         services\diagnostic\DatabaseTests.ts
//         services\diagnostic\SystemTests.ts
// rules:   - Module exports a shared `supabase` client instance; do not create additional Supabase clients or duplicate the initialization elsewhere in the codebase
//          - Session caching logic (`cachedSession`, `cacheTimestamp`) is module-scoped state that must remain synchronous and accessed only through the exported session functions, not directly mutated
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, Session } from '@supabase/supabase-js';
import { LoggingService } from './LoggingService';
import { Database } from '@/types/supabase';

// Get environment variables directly from process.env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient<Database>>;

// Session cache
let cachedSession: Session | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// In test environment, provide mock values to avoid initialization errors
if (!supabaseUrl || !supabaseAnonKey) {
  LoggingService.error('SupabaseClient', 'Supabase init error: URL or Anon Key is missing.');
  LoggingService.error('SupabaseClient', 'EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  LoggingService.error('SupabaseClient', 'EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');

  // In test environment, don't throw error but return mock client
  if (process.env.NODE_ENV === 'test') {
    // Create mock supabase client for tests
    const mockSupabase = {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => ({ error: null }),
        refreshSession: async () => ({ data: { session: null }, error: null }),
      },
      from: () => {
        const chainable = {
          select: () => chainable,
          insert: () => chainable,
          update: () => chainable,
          delete: () => chainable,
          upsert: () => chainable,
          eq: () => chainable,
          single: () => chainable,
          data: [],
          error: null,
        };
        return chainable;
      },
      rpc: async () => ({ data: [], error: null }),
    };

    // Return mock client instead of throwing error
    supabase = mockSupabase as unknown as ReturnType<typeof createClient<Database>>;
  } else {
    throw new Error("Supabase URL and Anon Key must be provided.");
  }
} else {
  try {
    // Validate URL format
    new URL(supabaseUrl);

    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (e) {
    LoggingService.error('SupabaseClient', 'CRITICAL: Supabase client could not be initialized.', e);
    throw e;
  }
}

/**
 * Returns the current session, using a 5-minute cache to reduce API calls.
 * Before returning a cached session, verifies the JWT is not expired.
 */
export const getCachedSession = async () => {
  const now = Date.now();
  if (cachedSession && (now - cacheTimestamp < CACHE_DURATION)) {
    try {
      const payload = JSON.parse(atob(cachedSession.access_token.split('.')[1]));
      if (payload.exp * 1000 > now) {
        return { data: { session: cachedSession }, error: null };
      }
    } catch {
      // Fall through to refresh if JWT decode fails
    }
  }

  const { data, error } = await supabase.auth.getSession();
  if (!error) {
    cachedSession = data.session;
    cacheTimestamp = now;
  }
  return { data, error };
};

export { supabase };

// Funzioni per la gestione dei token nei test
export const refreshAuthSession = async () => {
  try {
    const { data: { session }, error } = await getCachedSession();
    if (error) {
      LoggingService.error('SupabaseClient', 'Error getting session for refresh', error);
      return null;
    }
    return session;
  } catch (error) {
    LoggingService.error('SupabaseClient', 'Unexpected error during session refresh', error);
    return null;
  }
};

/**
 * Pulisce forzatamente la sessione di Supabase, gestendo eventuali errori
 * se nessuna sessione è attiva.
 */
export const clearSession = async () => {
  try {
    cachedSession = null;
    cacheTimestamp = 0;
    const { error } = await supabase.auth.signOut();
    if (error) {
      // Ignoriamo l'errore "Auth session not found" perché è l'obiettivo della pulizia.
      if (error.message !== 'Auth session not found') {
        LoggingService.error('SupabaseClient', 'Error during sign out for cleanup', error);
      }
    }
    LoggingService.info('SupabaseClient', 'Session cleaned up successfully.');
  } catch (error) {
    LoggingService.error('SupabaseClient', 'Unexpected error during session cleanup', error);
  }
};

export const forceRefreshToken = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) {
      LoggingService.error('SupabaseClient', 'Error refreshing session', error);
      return null;
    }
    // Update cache after forced refresh
    cachedSession = session;
    cacheTimestamp = Date.now();
    LoggingService.info('SupabaseClient', 'Session refreshed successfully');
    return session;
  } catch (error) {
    LoggingService.error('SupabaseClient', 'Unexpected error during token refresh', error);
    return null;
  }
};
