/**
 * Servizio Notifiche (Facade)
 * 
 * Questo è un servizio facade/composite che fornisce un'interfaccia unificata
 * a tutte le funzionalità di notifica. Delega a servizi specializzati:
 * - NotificationPermissionService: Gestione permessi
 * - NotificationCoreService: Pianificazione e cancellazione core
 * - NotificationBatchService: Operazioni batch
 * - EventEmitter: Sistema eventi (ri-esportato)
 * 
 * Tutti i metodi pubblici mantengono la compatibilità con l'API originale.
 */

import { Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Product } from '@/types/Product';
import { AppSettings } from './SettingsService';
import { LoggingService } from './LoggingService';
import { EventEmitter, eventEmitter } from './EventEmitter';
import { NotificationPermissionService } from './NotificationPermissionService';
import { NotificationCoreService } from './NotificationCoreService';
import { NotificationBatchService } from './NotificationBatchService';

/**
 * Configura il gestore notifiche per Expo Notifications
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Servizio Notifiche - Facade per tutte le operazioni di notifica
 * 
 * Questa classe fornisce accesso compatibile a tutte le funzionalità
 * di notifica delegando ai servizi interni specializzati.
 */
export class NotificationService {
  private static isInitialized = false;

  /**
   * Inizializza il sistema di notifiche.
   * Configura OneSignal per le notifiche push e crea i canali di notifica Android.
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

    LoggingService.info('NotificationService', 'Initializing OneSignal...');

    try {
      // Crea canale di notifica per Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        LoggingService.info('NotificationService', 'Default notification channel created.');
      }

      OneSignal.initialize(oneSignalAppId);
      OneSignal.Notifications.requestPermission(true);
      this.isInitialized = true;
      LoggingService.info('NotificationService', 'OneSignal SDK Initialized successfully.');
    } catch (error: unknown) {
      LoggingService.error('NotificationService', 'Error initializing OneSignal:', error);
    }
  }

  /**
   * Verifica se Expo Notifications è disponibile.
   * Usa il risultato in cache per le performance.
   * 
   * @returns true se Expo Notifications è disponibile
   * @deprecated Usa NotificationPermissionService.checkExpoNotificationsAvailability() invece
   */
  static checkExpoNotificationsAvailability(): boolean {
    return NotificationPermissionService.checkExpoNotificationsAvailability();
  }

  /**
   * Cancella tutte le notifiche per un prodotto specifico.
   * Cancella sia la notifica di scadenza che quella di pre-avviso.
   * 
   * @param productId - ID del prodotto
   */
  static async cancelNotification(productId: string): Promise<void> {
    return NotificationCoreService.cancelNotification(productId);
  }

  /**
   * Pianifica le notifiche di scadenza e pre-avviso per un prodotto.
   * 
   * @param product - Prodotto per cui pianificare le notifiche
   * @param notificationDays - Giorni prima della scadenza per inviare il pre-avviso (0 per nessuno)
   */
  static async scheduleExpirationNotification(
    product: Product,
    notificationDays: number
  ): Promise<void> {
    return NotificationCoreService.scheduleExpirationNotification(product, notificationDays);
  }

  /**
   * Ottiene i permessi correnti o li richiede se non concessi.
   * 
   * @returns Promise che restituisce true se i permessi sono concessi
   */
  static async getOrRequestPermissionsAsync(): Promise<boolean> {
    return NotificationPermissionService.getOrRequestPermissionsAsync();
  }

  /**
   * Pianifica una notifica di test che verrà attivata dopo 10 secondi.
   * Utile per verificare che la configurazione delle notifiche funzioni.
   */
  static async scheduleTestNotification(): Promise<void> {
    return NotificationCoreService.scheduleTestNotification();
  }

  /**
   * Verifica se le notifiche sono pianificate per un prodotto.
   * 
   * @param productId - ID del prodotto da verificare
   * @returns Promise che restituisce true se le notifiche sono pianificate
   */
  static async isNotificationScheduled(productId: string): Promise<boolean> {
    return NotificationCoreService.isNotificationScheduled(productId);
  }

  /**
   * Pianifica le notifiche per più prodotti in batch.
   * 
   * @param products - Array di prodotti da pianificare
   * @param settings - Impostazioni app con configurazione notificationDays
   */
  static async scheduleMultipleNotifications(
    products: Product[],
    settings: AppSettings
  ): Promise<void> {
    return NotificationBatchService.scheduleMultipleNotifications(products, settings);
  }
}

/**
 * Ri-esporta EventEmitter per compatibilità con le versioni precedenti
 * @deprecated Importa direttamente da './EventEmitter' invece
 */
export { EventEmitter, eventEmitter };
