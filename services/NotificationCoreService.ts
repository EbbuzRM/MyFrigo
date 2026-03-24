/**
 * NotificationCoreService
 *
 * Dopo la migrazione alle push server-side, questo servizio mantiene
 * SOLO scheduleTestNotification() per scopi diagnostici.
 *
 * I metodi di pianificazione locale (scheduleExpirationNotification,
 * cancelNotification, isNotificationScheduled) sono stati rimossi:
 * le notifiche di scadenza vengono ora inviate dalla Edge Function
 * send-expiration-notifications tramite OneSignal.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { LoggingService } from './LoggingService';
import { NotificationPermissionService } from './NotificationPermissionService';

export class NotificationCoreService {
  /**
   * Pianifica una notifica di test che si attiva dopo 10 secondi.
   * Consente di verificare che Expo Notifications sia correttamente configurato.
   */
  static async scheduleTestNotification(): Promise<void> {
    if (Platform.OS === 'web') return;

    if (!NotificationPermissionService.checkExpoNotificationsAvailability()) {
      LoggingService.error(
        'NotificationCoreService',
        'Cannot schedule test notification: Expo Notifications not available'
      );
      return;
    }

    const date = new Date(Date.now() + 10 * 1000); // +10 secondi
    LoggingService.info('NotificationCoreService', `Scheduling TEST notification for ${date.toISOString()}`);

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Notifica di Prova',
          body:  'Se vedi questo messaggio, le notifiche funzionano correttamente!',
          data:  { test: 'true' },
        },
        trigger: {
          type: SchedulableTriggerInputTypes.DATE,
          date,
        },
      });
      LoggingService.info('NotificationCoreService', 'Test notification scheduled successfully.');
    } catch (error: unknown) {
      LoggingService.error('NotificationCoreService', 'Error scheduling test notification:', error);
    }
  }
}
