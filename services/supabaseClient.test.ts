import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { LoggingService } from './LoggingService';

// Get environment variables directly from process.env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided for the test client.");
}

// Definiamo uno storage in-memory che non salva nulla.
const inMemoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// Questa versione del client è ESCLUSIVAMENTE per i test E2E.
// Forza la disabilitazione della persistenza della sessione.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: inMemoryStorage,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Esportiamo le funzioni helper vuote o mockate se necessario,
// anche se in questo caso non dovrebbero essere chiamate.
export const refreshAuthSession = async () => null;
export const forceRefreshToken = async () => null;
export const clearSession = async () => {};