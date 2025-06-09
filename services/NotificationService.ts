import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Product } from '@/types/Product';
import { StorageService } from './StorageService'; // Import StorageService

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

  static async scheduleExpirationNotification(product: Product): Promise<void> { // Removed daysBefore parameter
    if (Platform.OS === 'web') {
      return; // Skip notifications on web
    }

    try {
      const settings = await StorageService.getSettings();
      const daysBeforeToUse = settings.notificationDays; // Use stored value

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

  static async scheduleMultipleNotifications(products: Product[]): Promise<void> { // Removed daysBefore parameter
    if (Platform.OS === 'web') {
      return;
    }

    try {
      // Cancel all existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule new notifications
      // scheduleExpirationNotification will now use the stored setting for daysBefore
      const promises = products.map(product => 
        this.scheduleExpirationNotification(product)
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
