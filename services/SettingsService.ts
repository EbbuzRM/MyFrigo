import { supabase } from './supabaseClient';
import { TablesInsert, TablesUpdate } from '@/types/supabase';
import {
  convertSettingsToCamelCase,
  convertSettingsToSnakeCase
} from '../utils/caseConverter';
import { LoggingService } from './LoggingService';
import { UserNotificationSettingsService } from './UserNotificationSettingsService';

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
   * @returns Promise con le impostazioni dell'app
   */
  static async getSettings(): Promise<AppSettings> {
    try {
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
    } catch (error: unknown) {
      LoggingService.error('SettingsService', 'Error updating settings in Supabase', error);
      throw error;
    }
  }
}
