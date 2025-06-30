import * as Notifications from 'expo-notifications';
import { Platform, AppState, Vibration } from 'react-native';
import { Product } from '@/types/Product';
import { AppSettings } from '@/services/StorageService';
import Sound from 'react-native-sound'; // Importa react-native-sound

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') return true;

      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      return newStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  static async scheduleExpirationNotification(product: Product, notificationDays: number): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      const expirationDate = new Date(product.expirationDate);
      const notificationDate = new Date(expirationDate);
      notificationDate.setDate(notificationDate.getDate() - notificationDays);

      // Se la data di notifica è nel passato, non pianificare
      if (notificationDate <= new Date()) {
        return;
      }

      // Pianifica la notifica
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Prodotto in Scadenza',
          body: `${product.name} scadrà il ${expirationDate.toLocaleDateString('it-IT')}`,
          data: { productId: product.id },
        },
        trigger: {
          type: 'date',
          date: notificationDate,
        },
        identifier: `expiration_${product.id}`,
      });

      // Gestione suono e vibrazione (opzionale, se non gestito dal sistema)
      // Questa parte può essere attivata se il trigger non riproduce il suono/vibrazione desiderati
      // playNotificationSound();
      // Vibration.vibrate();

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
