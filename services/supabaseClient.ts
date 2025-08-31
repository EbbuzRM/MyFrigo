import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { LoggingService } from './LoggingService';

// Get environment variables directly from process.env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  LoggingService.error('SupabaseClient', 'Supabase init error: URL or Anon Key is missing.');
  LoggingService.error('SupabaseClient', 'EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  LoggingService.error('SupabaseClient', 'EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
  throw new Error("Supabase URL and Anon Key must be provided.");
}

let supabase: ReturnType<typeof createClient>;

try {
  // Validate URL format
  new URL(supabaseUrl);
  
  // Definiamo uno storage in-memory per i test per garantire l'isolamento totale.
  const inMemoryStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };

  const { isTestMode } = require('../services/test-env');

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: isTestMode ? inMemoryStorage : AsyncStorage,
      autoRefreshToken: !isTestMode,
      persistSession: !isTestMode,
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

export { supabase };

// Funzioni per la gestione dei token nei test
export const refreshAuthSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
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
    LoggingService.info('SupabaseClient', 'Session refreshed successfully');
    return session;
  } catch (error) {
    LoggingService.error('SupabaseClient', 'Unexpected error during token refresh', error);
    return null;
  }
};
