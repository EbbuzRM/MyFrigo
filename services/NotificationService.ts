import { Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import { supabase } from './supabaseClient';
import Constants from 'expo-constants';
import { Product } from '@/types/Product';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { AppSettings } from './StorageService';
import { LoggingService } from './LoggingService';

// --- Event Emitter Migliorato ---
type EventListener = (data?: any) => void;
const listeners: { [key: string]: EventListener[] } = {};

export const eventEmitter = {
  on(event: string, listener: EventListener) {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(listener);
    return () => { // Funzione di unsubscribe
      listeners[event] = listeners[event].filter(l => l !== listener);
    };
  },
  emit(event: string, data?: any) {
    if (listeners[event]) {
      listeners[event].forEach(listener => listener(data));
    }
  },
  // Nuovo metodo per rimuovere tutti i listener di un evento specifico
  removeAllListeners(event: string) {
    if (listeners[event]) {
      listeners[event] = [];
      return true;
    }
    return false;
  },
  // Nuovo metodo per rimuovere tutti i listener di tutti gli eventi
  removeAllEvents() {
    Object.keys(listeners).forEach(event => {
      listeners[event] = [];
    });
  }
};
// --------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  private static isInitialized = false;
  private static isExpoNotificationsAvailable = false;

  /**
   * Verifica se Expo Notifications è disponibile e correttamente linkato
   * @returns true se Expo Notifications è disponibile, false altrimenti
   */
  static checkExpoNotificationsAvailability(): boolean {
    if (Platform.OS === 'web') return false;
    
    try {
      // Verifica che le funzioni principali di Expo Notifications siano disponibili
      if (!Notifications ||
          typeof Notifications.scheduleNotificationAsync !== 'function' ||
          typeof Notifications.cancelScheduledNotificationAsync !== 'function') {
        LoggingService.error('NotificationService', 'Expo Notifications API not available or not properly linked');
        return false;
      }
      
      this.isExpoNotificationsAvailable = true;
      return true;
    } catch (error) {
      LoggingService.error('NotificationService', 'Error checking Expo Notifications availability:', error);
      return false;
    }
  }

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
      // Creazione del canale di notifica per Android
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
    } catch (error) {
      LoggingService.error('NotificationService', 'Error initializing OneSignal:', error);
    }
  }

  static async cancelNotification(productId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    
    // Verifica che Expo Notifications sia disponibile
    if (!this.isExpoNotificationsAvailable && !this.checkExpoNotificationsAvailability()) {
      LoggingService.error('NotificationService', 'Cannot cancel notification: Expo Notifications not available');
      return;
    }
    LoggingService.info('NotificationService', `Received cancellation request for product ID: ${productId}`);
    
    // Cancella sia la notifica principale che quella di preavviso
    const notificationId = productId;
    const preWarningNotificationId = `${productId}-pre`;

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      LoggingService.info('NotificationService', `SUCCESS: Main notification ${notificationId} cancelled.`);
    } catch (error) {
      // Non logghiamo come errore, perché è normale che una delle due non esista
      LoggingService.info('NotificationService', `INFO: Could not cancel main notification ${notificationId} (may not exist).`);
    }
    
    try {
      await Notifications.cancelScheduledNotificationAsync(preWarningNotificationId);
      LoggingService.info('NotificationService', `SUCCESS: Pre-warning notification ${preWarningNotificationId} cancelled.`);
    } catch (error) {
       LoggingService.info('NotificationService', `INFO: Could not cancel pre-warning notification ${preWarningNotificationId} (may not exist).`);
    }
  }

  static async scheduleExpirationNotification(product: Product, notificationDays: number): Promise<void> {
    if (Platform.OS === 'web' || !product.expirationDate) {
        if (!product.expirationDate) {
            LoggingService.info('NotificationService', `SKIPPING notification for "${product.name}" (ID: ${product.id}) because it has no expiration date.`);
        }
        return;
    }
    
    // Verifica che Expo Notifications sia disponibile
    if (!this.isExpoNotificationsAvailable && !this.checkExpoNotificationsAvailability()) {
      LoggingService.error('NotificationService', 'Cannot schedule notification: Expo Notifications not available');
      return;
    }

    LoggingService.info('NotificationService', `--- Starting scheduling for product: "${product.name}" (ID: ${product.id}) ---`);
    LoggingService.info('NotificationService', `Raw expiration date from DB: ${product.expirationDate}`);
    LoggingService.info('NotificationService', `Notification days setting: ${notificationDays}`);

    const now = new Date();
    LoggingService.info('NotificationService', `Current time is: ${now.toISOString()}`);

    // --- COSTRUZIONE ROBUSTA DELLA DATA CON VALIDAZIONE ---
    let expirationDate: Date;
    try {
      // Verifica che la data di scadenza sia in un formato valido
      if (!/^\d{4}-\d{2}-\d{2}/.test(product.expirationDate)) {
        throw new Error(`Invalid date format: ${product.expirationDate}`);
      }
      
      const dateString = product.expirationDate.split('T')[0];
      const parts = dateString.split('-');
      
      if (parts.length !== 3) {
        throw new Error(`Invalid date parts: ${dateString}`);
      }
      
      const [year, month, day] = parts.map(Number);
      
      // Verifica che i valori siano numeri validi
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        throw new Error(`Invalid date components: year=${year}, month=${month}, day=${day}`);
      }
      
      // Verifica che i valori siano in un intervallo ragionevole
      if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
        throw new Error(`Date values out of range: year=${year}, month=${month}, day=${day}`);
      }
      
      // Imposta l'orario di scadenza alle 9:00 del mattino, ora locale
      expirationDate = new Date(year, month - 1, day, 9, 0, 0);
      
      // Verifica che la data risultante sia valida
      if (isNaN(expirationDate.getTime())) {
        throw new Error(`Resulting date is invalid: ${expirationDate}`);
      }
      
      LoggingService.info('NotificationService', `Constructed expiration date (local 9 AM): ${expirationDate.toISOString()}`);

      // Notifica per il giorno della scadenza
      if (expirationDate > now) {
        const expirationIdentifier = product.id!;
        LoggingService.info('NotificationService', `Scheduling EXPIRATION notification with ID: ${expirationIdentifier} for ${expirationDate.toISOString()}`);
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Prodotto Scaduto!',
              body: `Il prodotto "${product.name}" è scaduto oggi.`,
              data: { productId: product.id },
            },
            trigger: { type: SchedulableTriggerInputTypes.DATE, date: expirationDate }, // NUOVO FORMATO
            identifier: expirationIdentifier,
          });
          LoggingService.info('NotificationService', `SUCCESS: Expiration notification scheduled for product ${product.id}.`);
        } catch (error) {
          LoggingService.error('NotificationService', `ERROR scheduling expiration notification for product ${product.id}:`, error);
        }
      } else {
          LoggingService.info('NotificationService', `SKIPPING expiration notification because the target time ${expirationDate.toISOString()} is in the past (current time: ${now.toISOString()}).`);
      }

      // Notifica di preavviso
      if (notificationDays > 0) {
        const preWarningDate = new Date(expirationDate);
        preWarningDate.setDate(preWarningDate.getDate() - notificationDays);
        LoggingService.info('NotificationService', `Constructed pre-warning date (local 9 AM): ${preWarningDate.toISOString()}`);

        if (preWarningDate > now) {
          const preWarningIdentifier = `${product.id}-pre`;
          LoggingService.info('NotificationService', `Scheduling PRE-WARNING notification with ID: ${preWarningIdentifier} for ${preWarningDate.toISOString()}`);
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Prodotto in Scadenza',
                body: `Il prodotto "${product.name}" scadrà tra ${notificationDays} giorni.`,
                data: { productId: product.id },
              },
              trigger: { type: SchedulableTriggerInputTypes.DATE, date: preWarningDate },
              identifier: preWarningIdentifier,
            });
            LoggingService.info('NotificationService', `SUCCESS: Pre-warning notification scheduled for product ${product.id}.`);
          } catch (error) {
            LoggingService.error('NotificationService', `ERROR scheduling pre-warning notification for product ${product.id}:`, error);
          }
        } else {
            LoggingService.info('NotificationService', `SKIPPING pre-warning notification because the target time ${preWarningDate.toISOString()} is in the past (current time: ${now.toISOString()}).`);
        }
      }
      LoggingService.info('NotificationService', `--- Finished scheduling for product: "${product.name}" ---`);
    } catch (error) {
      LoggingService.error('NotificationService', `Error processing expiration date for product ${product.id}:`, error);
    }
  }

  static async getOrRequestPermissionsAsync(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    
    // Verifica che Expo Notifications sia disponibile
    if (!this.isExpoNotificationsAvailable && !this.checkExpoNotificationsAvailability()) {
      LoggingService.error('NotificationService', 'Cannot check permissions: Expo Notifications not available');
      return false;
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      LoggingService.info('NotificationService', 'Permissions not granted, requesting...');
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          provideAppNotificationSettings: true,
        },
      });
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      LoggingService.info('NotificationService', 'Permission request denied or failed.');
      return false;
    }
    
    LoggingService.info('NotificationService', 'Permissions are granted.');
    return true;
  }

  static async scheduleTestNotification(): Promise<void> {
    if (Platform.OS === 'web') return;
    
    // Verifica che Expo Notifications sia disponibile
    if (!this.isExpoNotificationsAvailable && !this.checkExpoNotificationsAvailability()) {
      LoggingService.error('NotificationService', 'Cannot schedule test notification: Expo Notifications not available');
      return;
    }

    const date = new Date(Date.now() + 10 * 1000); // 10 secondi da adesso
    LoggingService.info('NotificationService', `Scheduling TEST notification to trigger at ${date.toISOString()}.`);
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Notifica di Prova',
          body: 'Se vedi questo messaggio, le notifiche funzionano correttamente!',
          data: { test: 'true' },
        },
        trigger: { type: SchedulableTriggerInputTypes.DATE, date }, // NUOVO FORMATO
      });
      LoggingService.info('NotificationService', 'SUCCESS: Test notification scheduled.');
    } catch (error) {
      LoggingService.error('NotificationService', 'ERROR scheduling test notification:', error);
    }
  }

  static async isNotificationScheduled(productId: string): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    
    // Verifica che Expo Notifications sia disponibile
    if (!this.isExpoNotificationsAvailable && !this.checkExpoNotificationsAvailability()) {
      LoggingService.error('NotificationService', 'Cannot check scheduled notifications: Expo Notifications not available');
      return false;
    }
    try {
      const mainIdentifier = productId;
      const preWarningIdentifier = `${productId}-pre`;

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      const mainNotification = scheduledNotifications.find(n => n.identifier === mainIdentifier);
      const preWarningNotification = scheduledNotifications.find(n => n.identifier === preWarningIdentifier);

      let logMessage = `[NotificationService] Check for product ${productId}:`;
      let isScheduled = false;

      if (preWarningNotification && preWarningNotification.trigger && 'date' in preWarningNotification.trigger) {
          const date = new Date(preWarningNotification.trigger.date);
          logMessage += ` Pre-warning SCHEDULED for ${date.toLocaleDateString('it-IT')}.`;
          isScheduled = true;
      }

      if (mainNotification && mainNotification.trigger && 'date' in mainNotification.trigger) {
          const date = new Date(mainNotification.trigger.date);
          logMessage += ` Expiration SCHEDULED for ${date.toLocaleDateString('it-IT')}.`;
          isScheduled = true;
      }

      if (!isScheduled) {
          logMessage += ` NOT SCHEDULED.`;
      }

      LoggingService.info('NotificationService', logMessage);
      return isScheduled;

    } catch (error) {
      LoggingService.error('NotificationService', `Error checking scheduled notification for product ${productId}:`, error);
      return false; // È più sicuro restituire false in caso di errore
    }
  }

  static async scheduleMultipleNotifications(products: Product[], settings: AppSettings): Promise<void> {
    if (Platform.OS === 'web') return;
    
    // Verifica che Expo Notifications sia disponibile
    if (!this.isExpoNotificationsAvailable && !this.checkExpoNotificationsAvailability()) {
      LoggingService.error('NotificationService', 'Cannot schedule multiple notifications: Expo Notifications not available');
      return;
    }
    
    // Ottimizzazione: processa le notifiche in batch di 5 alla volta
    const batchSize = 5;
    const batches = [];
    
    // Dividi i prodotti in batch
    for (let i = 0; i < products.length; i += batchSize) {
      batches.push(products.slice(i, i + batchSize));
    }
    
    // Processa i batch in parallelo
    for (const batch of batches) {
      await Promise.all(
        batch.map(product =>
          this.scheduleExpirationNotification(product, settings.notificationDays)
            .catch(error => {
              LoggingService.error('NotificationService',
                `Error scheduling notification for product ${product.id}:`, error);
            })
        )
      );
    }
    
    LoggingService.info('NotificationService',
      `Scheduled notifications for ${products.length} products in ${batches.length} batches`);
  }
}
