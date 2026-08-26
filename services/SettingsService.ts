// SettingsService.ts — SettingsService module.
//
// exports: AppSettings | SettingsService
// used_by: context\SettingsContext.tsx
//                   context\ThemeContext.tsx
//                   context\__tests__\SettingsContext.test.tsx
//                   services\diagnostic\DatabaseTests.ts
//                   services\diagnostic\PerformanceTests.ts
//                   services\diagnostic\SystemTests.ts
//                   utils\caseConverter.ts
// rules:   The configuration table `app_settings` is a singleton (single row with id=1). Reading/writing must never assume multiple rows exist.
//          All data flowing between the service and external callers must use camelCase conversion via `convertSettingsToCamelCase`/`convertSettingsToSnakeCase` utilities.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { supabase } from './supabaseClient';
import { TablesInsert, TablesUpdate } from '@/types/supabase';
import {
  convertSettingsToCamelCase,
  convertSettingsToSnakeCase
} from '../utils/caseConverter';
import { LoggingService } from './LoggingService';
import { UserNotificationSettingsService } from './UserNotificationSettingsService';

/** Max retries for transient JWT clock-skew errors (PGRST303). */
const MAX_JWT_RETRIES = 2;
/** Base delay in ms for exponential backoff on PGRST303 retries (1 s, 2 s). */
const JWT_RETRY_BASE_DELAY_MS = 1000;

/**
 * Returns true if the error is a PGRST303 ("JWT issued at … is in the future").
 * This is a transient clock-skew error that can be resolved by refreshing the token.
 */
function isJwtClockSkewError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code === 'PGRST303';
  }
  return false;
}

/**
 * Executes an async operation with automatic retry on PGRST303 (JWT clock skew).
 * Before each retry, refreshes the Supabase session and waits with exponential backoff.
 */
async function withJwtRetry<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_JWT_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      if (!isJwtClockSkewError(error) || attempt === MAX_JWT_RETRIES) {
        throw error;
      }
      LoggingService.warning(
        'SettingsService',
        `${context}: PGRST303 detected, refreshing session (attempt ${attempt + 1}/${MAX_JWT_RETRIES})`
      );
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        LoggingService.error('SettingsService', `${context}: session refresh failed`, refreshError);
        throw error;
      }
      const delay = JWT_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  // Unreachable, but TypeScript needs it
  throw lastError;
}

/**
 * Interfaccia per le impostazioni dell'app
 */
export interface AppSettings {
  notificationDays: number;
  theme: 'light' | 'dark' | 'auto';
}

/**
 * Servizio per la gestione delle impostazioni dell'app.
 *
 * app_settings: impostazioni globali/tema (tabella con singola riga id=1)
 * user_notification_settings: impostazioni notifiche per-utente (gestite da UserNotificationSettingsService)
 */
export class SettingsService {

  /**
   * Ascolta i cambiamenti nelle impostazioni dell'app
   * @param callback Funzione da chiamare quando ci sono cambiamenti
   * @returns Funzione per annullare la sottoscrizione
   */
  static listenToSettings(callback: (settings: AppSettings) => void): (() => void) {
    const channel = supabase
      .channel('public:app_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, async () => {
        const settings = await this.getSettings();
        callback(settings);
      })
      .subscribe();

    this.getSettings().then(callback);

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Recupera le impostazioni dell'app dalla tabella globale app_settings.
   * Retries automatically on PGRST303 (JWT clock skew) after refreshing the session.
   * @returns Promise con le impostazioni dell'app
   */
  static async getSettings(): Promise<AppSettings> {
    try {
      return await withJwtRetry(async () => {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('id', 1)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          return convertSettingsToCamelCase(data);
        }

        LoggingService.info('SettingsService', 'No settings found, creating default settings');
        const defaultSettings = {
          id: 1,
          notification_days: 3,
          theme: 'auto',
        };

        const { error: insertError } = await supabase
          .from('app_settings')
          .insert(defaultSettings as unknown as TablesInsert<'app_settings'>);

        if (insertError) {
          throw insertError;
        }

        return convertSettingsToCamelCase(defaultSettings);
      }, 'getSettings');

    } catch (error: unknown) {
      LoggingService.error('SettingsService', 'Error getting or creating settings in Supabase', error);
      return {
        notificationDays: 3,
        theme: 'auto',
      };
    }
  }

  /**
   * Aggiorna le impostazioni dell'app.
   *
   * Se notificationDays cambia, aggiorna anche user_notification_settings
   * per l'utente corrente (il cron server-side userà quel valore).
   * La ripianificazione locale delle notifiche è stata rimossa — le notifiche
   * vengono ora gestite dalla Edge Function send-expiration-notifications.
   *
   * @param newSettings Nuove impostazioni da applicare
   * @returns Promise con le impostazioni aggiornate o null in caso di errore
   */
  static async updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings | null> {
    try {
      return await withJwtRetry(async () => {
        const { data, error } = await supabase
          .from('app_settings')
          .upsert({ id: 1, ...convertSettingsToSnakeCase(newSettings) } as unknown as TablesUpdate<'app_settings'>)
          .select()
          .single();

        if (error) throw error;

        const updatedSettings = convertSettingsToCamelCase(data);

        // Sincronizza notification_days anche nella tabella per-utente
        if (Object.prototype.hasOwnProperty.call(newSettings, 'notificationDays')) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await UserNotificationSettingsService.updateSettings(user.id, {
              notificationDays: newSettings.notificationDays,
            });
            LoggingService.info('SettingsService', 'User notification settings synced', { userId: user.id });
          } else {
            LoggingService.warning('SettingsService', 'No authenticated user found, skipping user_notification_settings sync');
          }
        }

        return updatedSettings;
      }, 'updateSettings');
    } catch (error: unknown) {
      LoggingService.error('SettingsService', 'Error updating settings in Supabase', error);
      throw error;
    }
  }
}
