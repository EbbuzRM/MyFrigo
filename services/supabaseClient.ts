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
  
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Disabilita il detection nell'URL
      flowType: 'implicit',
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
