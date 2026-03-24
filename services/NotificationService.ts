/**
 * Servizio Notifiche (Facade)
 *
 * Dopo la migrazione alle push server-side (OneSignal + Edge Function),
 * questo servizio mantiene solo:
 *   - initialize(): setup OneSignal + canale Android
 *   - scheduleTestNotification(): diagnostica
 *   - setNotificationHandler: ricezione push in foreground
 *
 * I metodi di pianificazione locale (scheduleExpirationNotification,
 * scheduleMultipleNotifications, cancelNotification) sono stati rimossi
 * perché le notifiche di scadenza sono ora gestite server-side.
 */

import { Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { LoggingService } from './LoggingService';
import { EventEmitter, eventEmitter } from './EventEmitter';
import { NotificationPermissionService } from './NotificationPermissionService';
import { NotificationCoreService } from './NotificationCoreService';

/**
 * Configura il gestore notifiche per Expo Notifications.
 * Necessario per mostrare le push di OneSignal quando l'app è in foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
  }),
});

export class NotificationService {
  private static isInitialized = false;

  /**
   * Inizializza il sistema di notifiche.
   * Configura OneSignal per le notifiche push e crea il canale Android.
   */
  static initialize(): void {
    if (this.isInitialized || Platform.OS === 'web') {
      return;
    }

    const oneSignalAppId = Constants.expoConfig?.extra?.oneSignalAppId;
    if (!oneSignalAppId) {
      LoggingService.error('NotificationService', 'FATAL: OneSignal App ID not found in app.json.');
      return;
    }

    if (!OneSignal || typeof OneSignal.initialize !== 'function') {
      LoggingService.error('NotificationService', 'FATAL: OneSignal native module not linked.');
      return;
    }

    try {
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name:             'Default',
          importance:       Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor:       '#FF231F7C',
        });
        LoggingService.info('NotificationService', 'Default notification channel created.');
      }

      OneSignal.initialize(oneSignalAppId);
      OneSignal.Notifications.requestPermission(true);
      this.isInitialized = true;
      LoggingService.info('NotificationService', 'OneSignal SDK initialized successfully.');
    } catch (error: unknown) {
      LoggingService.error('NotificationService', 'Error initializing OneSignal:', error);
    }
  }

  /**
   * Ottieni o richiedi i permessi di notifica.
   * @returns Promise che restituisce true se i permessi sono concessi
   */
  static async getOrRequestPermissionsAsync(): Promise<boolean> {
    return NotificationPermissionService.getOrRequestPermissionsAsync();
  }

  /**
   * Pianifica una notifica di test (si attiva dopo 10 secondi).
   * Utile per verificare che OneSignal e il canale Android funzionino.
   */
  static async scheduleTestNotification(): Promise<void> {
    return NotificationCoreService.scheduleTestNotification();
  }
}

/**
 * Ri-esporta EventEmitter per compatibilità con le versioni precedenti.
 * @deprecated Importa direttamente da './EventEmitter'
 */
export { EventEmitter, eventEmitter };
