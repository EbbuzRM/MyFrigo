/**
 * UserNotificationSettingsService
 *
 * Gestisce le impostazioni di notifica per-utente sulla tabella
 * user_notification_settings (separata dalla tabella globale app_settings).
 */

import { supabase } from './supabaseClient';
import { LoggingService } from './LoggingService';

export interface UserNotificationSettings {
  notificationsEnabled: boolean;
  notificationDays: number;
}

const DEFAULT_SETTINGS: UserNotificationSettings = {
  notificationsEnabled: true,
  notificationDays: 3,
};

export class UserNotificationSettingsService {
  /**
   * Recupera le impostazioni di notifica per l'utente specificato.
   * Se il record non esiste lo crea con i valori di default.
   */
  static async getSettings(userId: string): Promise<UserNotificationSettings> {
    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('notifications_enabled, notification_days')
        .eq('user_id', userId)
        .single();

      if (error) {
        // PGRST116 = no rows found → crea il record
        if (error.code === 'PGRST116') {
          return await this.ensureSettings(userId);
        }
        throw error;
      }

      return {
        notificationsEnabled: data.notifications_enabled,
        notificationDays:     data.notification_days,
      };
    } catch (error) {
      LoggingService.error('UserNotificationSettingsService', 'Error getting notification settings', { userId, error });
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Aggiorna le impostazioni di notifica per l'utente specificato.
   */
  static async updateSettings(
    userId: string,
    settings: Partial<UserNotificationSettings>
  ): Promise<UserNotificationSettings | null> {
    try {
      const updatePayload: Record<string, unknown> = {};
      if (settings.notificationsEnabled !== undefined) {
        updatePayload.notifications_enabled = settings.notificationsEnabled;
      }
      if (settings.notificationDays !== undefined) {
        updatePayload.notification_days = settings.notificationDays;
      }

      const { data, error } = await supabase
        .from('user_notification_settings')
        .upsert({ user_id: userId, ...updatePayload })
        .select('notifications_enabled, notification_days')
        .single();

      if (error) throw error;

      LoggingService.info('UserNotificationSettingsService', 'Notification settings updated', { userId });

      return {
        notificationsEnabled: data.notifications_enabled,
        notificationDays:     data.notification_days,
      };
    } catch (error) {
      LoggingService.error('UserNotificationSettingsService', 'Error updating notification settings', { userId, error });
      return null;
    }
  }

  /**
   * Crea il record impostazioni se non esiste ancora.
   * Da chiamare al primo login dell'utente.
   * Legge notification_days da app_settings (tabella globale) come valore iniziale.
   */
  static async ensureSettings(userId: string): Promise<UserNotificationSettings> {
    try {
      // Leggi il valore globale corrente da app_settings come default iniziale
      const { data: globalSettings } = await supabase
        .from('app_settings')
        .select('notification_days')
        .eq('id', 1)
        .single();

      const defaultDays = globalSettings?.notification_days ?? DEFAULT_SETTINGS.notificationDays;

      const { data, error } = await supabase
        .from('user_notification_settings')
        .upsert(
          {
            user_id:              userId,
            notifications_enabled: DEFAULT_SETTINGS.notificationsEnabled,
            notification_days:    defaultDays,
          },
          { onConflict: 'user_id' }
        )
        .select('notifications_enabled, notification_days')
        .single();

      if (error) throw error;

      LoggingService.info('UserNotificationSettingsService', 'Notification settings ensured', { userId });

      return {
        notificationsEnabled: data.notifications_enabled,
        notificationDays:     data.notification_days,
      };
    } catch (error) {
      LoggingService.error('UserNotificationSettingsService', 'Error ensuring notification settings', { userId, error });
      return DEFAULT_SETTINGS;
    }
  }
}
