import { supabase } from './supabaseClient';
import { TablesInsert, TablesUpdate } from '@/types/supabase';
import {
  convertSettingsToCamelCase,
  convertSettingsToSnakeCase
} from '../utils/caseConverter';
import { LoggingService } from './LoggingService';
import { NotificationService } from './NotificationService';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Interfaccia per le impostazioni dell'app
 */
export interface AppSettings {
  notificationDays: number;
  theme: 'light' | 'dark' | 'auto';
}


/**
 * Servizio per la gestione delle impostazioni dell'app
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
   * Recupera le impostazioni dell'app
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
   * Aggiorna le impostazioni dell'app
   * @param newSettings Nuove impostazioni da applicare
   * @returns Promise con le impostazioni aggiornate o null in caso di errore
   * @throws Error se si verifica un errore durante l'aggiornamento
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

      if (Platform.OS !== 'web') {
        if (Object.prototype.hasOwnProperty.call(newSettings, 'notificationDays')) {
          // Import ProductStorage dynamically to avoid circular dependency
          const { ProductStorage } = await import('./ProductStorage');
          const productsResult = await ProductStorage.getProducts();
          if (productsResult.success && productsResult.data) {
            const products = productsResult.data;
            const activeProducts = products.filter(p => p.status === 'active');
            await Notifications.cancelAllScheduledNotificationsAsync();
            await NotificationService.scheduleMultipleNotifications(activeProducts, updatedSettings);
          }
        }
      }
      return updatedSettings;
    } catch (error: unknown) {
      LoggingService.error('SettingsService', 'Error updating settings in Supabase', error);
      throw error;
    }
  }
}