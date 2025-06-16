import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Product } from '@/types/Product';
// DO NOT import StorageService here to break the cycle.
// Instead, settings will be passed as arguments where needed.
// import { StorageService } from './StorageService'; 
import { AppSettings } from '@/services/StorageService'; // Import AppSettings type

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // Sostituisce shouldShowAlert, mostra la notifica come banner
    shouldShowList: true, // Sostituisce shouldShowAlert, mostra la notifica nella lista delle notifiche
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true; // Web doesn't require explicit permissions
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async scheduleExpirationNotification(product: Product, notificationDays: number): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      // const settings = await StorageService.getSettings(); // Removed direct call
      const daysBeforeToUse = notificationDays; // Use passed argument

      const expirationDate = new Date(product.expirationDate);
      const notificationDate = new Date(expirationDate);
      notificationDate.setDate(notificationDate.getDate() - daysBeforeToUse);

      // Don't schedule if notification date is in the past
      if (notificationDate <= new Date()) {
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Prodotto in Scadenza',
          body: `${product.name} scadrà il ${expirationDate.toLocaleDateString('it-IT')}`,
          data: { productId: product.id, type: 'expiration' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationDate,
        },
        identifier: `expiration_${product.id}`,
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  static async cancelNotification(productId: string): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      await Notifications.cancelScheduledNotificationAsync(`expiration_${productId}`);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  static async scheduleMultipleNotifications(products: Product[], settings: AppSettings): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }
    
    if (!settings.notificationsEnabled) {
      await Notifications.cancelAllScheduledNotificationsAsync(); // Cancel all if disabled
      console.log('Notifications are disabled, all scheduled notifications cancelled.');
      return;
    }

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const notificationDays = settings.notificationDays;

      const promises = products.map(product => 
        this.scheduleExpirationNotification(product, notificationDays)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Error scheduling multiple notifications:', error);
    }
  }

  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    if (Platform.OS === 'web') {
      return [];
    }

    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
}
