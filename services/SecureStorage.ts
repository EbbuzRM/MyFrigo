// SecureStorage.ts — Encrypted storage adapter for Supabase auth tokens.
//
// exports: SecureStorage | migrateTokensFromAsyncStorage
// used_by: services\supabaseClient.ts
// rules:   - This module is the ONLY place that imports expo-secure-store for auth token storage
//          - All getItem/setItem/removeItem must go through this adapter — never use SecureStore directly
//          - Migration from AsyncStorage must be idempotent (safe to call multiple times)
//          - In test environment, falls back to in-memory Map (SecureStore unavailable in Jest)

import { LoggingService } from './LoggingService';

const TAG = 'SecureStorage';
const MIGRATION_FLAG_KEY = '@myfrigo_secure_storage_migrated';

// Supabase auth storage keys
const SUPABASE_SESSION_KEY = 'sb-tfhjupcybietwzmnpwfh-auth-token';

/**
 * In-memory fallback for test environment where expo-secure-store is unavailable.
 */
class InMemoryStorage {
  private store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/**
 * Encrypted storage adapter wrapping expo-secure-store.
 * Implements the GoTrueAsyncStorage interface required by Supabase.
 *
 * Falls back to in-memory storage in test environment.
 */
class SecureStorageAdapter {
  private secureStore: typeof import('expo-secure-store') | null = null;
  private memoryFallback: InMemoryStorage | null = null;
  private initialized = false;

  private async init(): Promise<void> {
    if (this.initialized) return;

    if (process.env.NODE_ENV === 'test') {
      this.memoryFallback = new InMemoryStorage();
      this.initialized = true;
      return;
    }

    try {
      this.secureStore = await import('expo-secure-store');
      this.initialized = true;
    } catch (error) {
      LoggingService.error(TAG, 'Failed to load expo-secure-store, using in-memory fallback', error);
      this.memoryFallback = new InMemoryStorage();
      this.initialized = true;
    }
  }

  async getItem(key: string): Promise<string | null> {
    await this.init();

    if (this.memoryFallback) {
      return this.memoryFallback.getItem(key);
    }

    try {
      return await this.secureStore!.getItemAsync(key);
    } catch (error) {
      LoggingService.error(TAG, 'SecureStore getItem failed', { key, error });
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.init();

    if (this.memoryFallback) {
      return this.memoryFallback.setItem(key, value);
    }

    try {
      await this.secureStore!.setItemAsync(key, value);
    } catch (error) {
      LoggingService.error(TAG, 'SecureStore setItem failed', { key, error });
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    await this.init();

    if (this.memoryFallback) {
      return this.memoryFallback.removeItem(key);
    }

    try {
      await this.secureStore!.deleteItemAsync(key);
    } catch (error) {
      LoggingService.error(TAG, 'SecureStore removeItem failed', { key, error });
    }
  }
}

export const SecureStorage = new SecureStorageAdapter();

/**
 * Migrates existing auth tokens from AsyncStorage (plaintext) to SecureStore (encrypted).
 * Idempotent: safe to call multiple times. Sets a migration flag after first successful run.
 *
 * Call once during app startup (before Supabase client is used).
 */
export async function migrateTokensFromAsyncStorage(): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return; // Skip migration in tests
  }

  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;

    // Check if migration already completed
    const alreadyMigrated = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
    if (alreadyMigrated === 'true') {
      return;
    }

    LoggingService.info(TAG, 'Starting token migration from AsyncStorage to SecureStore');

    // Migrate Supabase session token
    const sessionToken = await AsyncStorage.getItem(SUPABASE_SESSION_KEY);
    if (sessionToken) {
      await SecureStorage.setItem(SUPABASE_SESSION_KEY, sessionToken);
      await AsyncStorage.removeItem(SUPABASE_SESSION_KEY);
      LoggingService.info(TAG, 'Supabase session token migrated successfully');
    }

    // Set migration flag
    await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    LoggingService.info(TAG, 'Token migration completed');
  } catch (error) {
    LoggingService.error(TAG, 'Token migration failed (non-fatal, will retry on next launch)', error);
  }
}
