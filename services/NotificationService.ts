import { Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import { supabase } from './supabaseClient';
import Constants from 'expo-constants';
import { Product } from '@/types/Product';
import * as Notifications from 'expo-notifications';
import { AppSettings } from './StorageService';

// --- Event Emitter Semplice ---
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

  static initialize(): void {
    if (this.isInitialized || Platform.OS === 'web') {
      return;
    }
    const oneSignalAppId = Constants.expoConfig?.extra?.oneSignalAppId;
    if (!oneSignalAppId) {
      console.error('[NotificationService] FATAL: OneSignal App ID not found in app.json.');
      return;
    }
    if (!OneSignal || typeof OneSignal.initialize !== 'function') {
      console.error('[NotificationService] FATAL: OneSignal native module not linked.');
      return;
    }
    console.log('[NotificationService] Initializing OneSignal...');
    try {
      // Creazione del canale di notifica per Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        console.log('[NotificationService] Default notification channel created.');
      }

      OneSignal.initialize(oneSignalAppId);
      OneSignal.Notifications.requestPermission(true);
      this.isInitialized = true;
      console.log('[NotificationService] OneSignal SDK Initialized successfully.');
    } catch (error) {
      console.error('[NotificationService] Error initializing OneSignal:', error);
    }
  }

  static async cancelNotification(productId: string): Promise<void> {
    if (Platform.OS === 'web') return;
    console.log(`[NotificationService] Received cancellation request for product ID: ${productId}`);
    
    // Cancella sia la notifica principale che quella di preavviso
    const notificationId = productId;
    const preWarningNotificationId = `${productId}-pre`;

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`[NotificationService] SUCCESS: Main notification ${notificationId} cancelled.`);
    } catch (error) {
      // Non logghiamo come errore, perché è normale che una delle due non esista
      console.log(`[NotificationService] INFO: Could not cancel main notification ${notificationId} (may not exist).`);
    }
    
    try {
      await Notifications.cancelScheduledNotificationAsync(preWarningNotificationId);
      console.log(`[NotificationService] SUCCESS: Pre-warning notification ${preWarningNotificationId} cancelled.`);
    } catch (error) {
       console.log(`[NotificationService] INFO: Could not cancel pre-warning notification ${preWarningNotificationId} (may not exist).`);
    }
  }

  static async scheduleExpirationNotification(product: Product, notificationDays: number): Promise<void> {
    if (Platform.OS === 'web' || !product.expirationDate) {
        if (!product.expirationDate) {
            console.log(`[NotificationService] SKIPPING notification for "${product.name}" (ID: ${product.id}) because it has no expiration date.`);
        }
        return;
    }

    console.log(`[NotificationService] --- Starting scheduling for product: "${product.name}" (ID: ${product.id}) ---`);
    console.log(`[NotificationService] Raw expiration date from DB: ${product.expirationDate}`);
    console.log(`[NotificationService] Notification days setting: ${notificationDays}`);

    const now = new Date();
    console.log(`[NotificationService] Current time is: ${now.toISOString()}`);

    // --- COSTRUZIONE ROBUSTA DELLA DATA ---
    const dateString = product.expirationDate.split('T')[0];
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Imposta l'orario di scadenza alle 9:00 del mattino, ora locale
    const expirationDate = new Date(year, month - 1, day, 9, 0, 0);
    console.log(`[NotificationService] Constructed expiration date (local 9 AM): ${expirationDate.toISOString()}`);

    // Notifica per il giorno della scadenza
    if (expirationDate > now) {
      const expirationIdentifier = product.id!;
      console.log(`[NotificationService] Scheduling EXPIRATION notification with ID: ${expirationIdentifier} for ${expirationDate.toISOString()}`);
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Prodotto Scaduto!',
            body: `Il prodotto "${product.name}" è scaduto oggi.`,
            data: { productId: product.id },
          },
          trigger: { type: 'date', date: expirationDate }, // NUOVO FORMATO
          identifier: expirationIdentifier,
        });
        console.log(`[NotificationService] SUCCESS: Expiration notification scheduled for product ${product.id}.`);
      } catch (error) {
        console.error(`[NotificationService] ERROR scheduling expiration notification for product ${product.id}:`, error);
      }
    } else {
        console.log(`[NotificationService] SKIPPING expiration notification because the target time ${expirationDate.toISOString()} is in the past (current time: ${now.toISOString()}).`);
    }

    // Notifica di preavviso
    if (notificationDays > 0) {
      const preWarningDate = new Date(expirationDate);
      preWarningDate.setDate(preWarningDate.getDate() - notificationDays);
      console.log(`[NotificationService] Constructed pre-warning date (local 9 AM): ${preWarningDate.toISOString()}`);

      if (preWarningDate > now) {
        const preWarningIdentifier = `${product.id}-pre`;
        console.log(`[NotificationService] Scheduling PRE-WARNING notification with ID: ${preWarningIdentifier} for ${preWarningDate.toISOString()}`);
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Prodotto in Scadenza',
              body: `Il prodotto "${product.name}" scadrà tra ${notificationDays} giorni.`,
              data: { productId: product.id },
            },
            trigger: { type: 'date', date: preWarningDate }, // NUOVO FORMATO
            identifier: preWarningIdentifier,
          });
          console.log(`[NotificationService] SUCCESS: Pre-warning notification scheduled for product ${product.id}.`);
        } catch (error) {
          console.error(`[NotificationService] ERROR scheduling pre-warning notification for product ${product.id}:`, error);
        }
      } else {
          console.log(`[NotificationService] SKIPPING pre-warning notification because the target time ${preWarningDate.toISOString()} is in the past (current time: ${now.toISOString()}).`);
      }
    }
    console.log(`[NotificationService] --- Finished scheduling for product: "${product.name}" ---`);
  }

  static async getOrRequestPermissionsAsync(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('[NotificationService] Permissions not granted, requesting...');
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('[NotificationService] Permission request denied or failed.');
      return false;
    }
    
    console.log('[NotificationService] Permissions are granted.');
    return true;
  }

  static async scheduleTestNotification(): Promise<void> {
    if (Platform.OS === 'web') return;

    const date = new Date(Date.now() + 10 * 1000); // 10 secondi da adesso
    console.log(`[NotificationService] Scheduling TEST notification to trigger at ${date.toISOString()}.`);
    
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Notifica di Prova',
          body: 'Se vedi questo messaggio, le notifiche funzionano correttamente!',
          data: { test: 'true' },
        },
        trigger: { type: 'date', date }, // NUOVO FORMATO
      });
      console.log('[NotificationService] SUCCESS: Test notification scheduled.');
    } catch (error) {
      console.error('[NotificationService] ERROR scheduling test notification:', error);
    }
  }

  static async isNotificationScheduled(productId: string): Promise<boolean> {
    if (Platform.OS === 'web') return false;
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

      console.log(logMessage);
      return isScheduled;

    } catch (error) {
      console.error(`[NotificationService] Error checking scheduled notification for product ${productId}:`, error);
      return false; // È più sicuro restituire false in caso di errore
    }
  }

  static async scheduleMultipleNotifications(products: Product[], settings: AppSettings): Promise<void> {
    if (Platform.OS === 'web') return;
    for (const product of products) {
      await this.scheduleExpirationNotification(product, settings.notificationDays);
    }
  }
}
