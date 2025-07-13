import { Platform, Alert } from 'react-native';
import { Product } from '@/types/Product';
import { AppSettings } from '@/services/StorageService';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabaseClient';
import OneSignal from 'react-native-onesignal';

export class NotificationService {
  static async createNotificationChannel(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  static async scheduleExpirationNotification(product: Product, notificationDays: number): Promise<void> {
    if (Platform.OS === 'web') return;

    const dateParts = product.expiration_date.split('-').map(part => parseInt(part, 10));
    const expirationDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    expirationDate.setHours(23, 59, 59, 999);

    const notificationDate = new Date(expirationDate.getTime() - notificationDays * 86400000);
    notificationDate.setHours(9, 0, 0, 0);

    const now = new Date();
    if (notificationDate > now) {
      const triggerInSeconds = (notificationDate.getTime() - now.getTime()) / 1000;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Prodotto in scadenza!',
          body: `${product.name} scade il ${expirationDate.toLocaleDateString()}.`,
          data: { productId: product.id },
        },
        trigger: {
          seconds: triggerInSeconds,
        },
      });
    }
  }

  static async scheduleMultipleNotifications(products: Product[], settings: AppSettings): Promise<void> {
    if (Platform.OS === 'web' || !settings.notificationsEnabled) return;

    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const product of products) {
      if (product.status === 'active') {
        await this.scheduleExpirationNotification(product, settings.notificationDays);
      }
    }
  }
  
  static async getOneSignalPlayerId(): Promise<string | undefined> {
    if (Platform.OS === 'web') return;
    // @ts-ignore: Using deprecated method that works
    const deviceState = await OneSignal.getDeviceState();
    return deviceState?.userId;
  }

  static async saveOneSignalPlayerId(userId: string, oneSignalPlayerId: string): Promise<void> {
    if (!userId || !oneSignalPlayerId) {
      console.error('User ID or OneSignal Player ID is missing.');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ one_signal_player_id: oneSignalPlayerId })
        .eq('id', userId);

      if (error) throw error;
      console.log('OneSignal Player ID saved to Supabase.');
    } catch (error) {
      console.error('Error saving OneSignal Player ID:', error);
    }
  }

  static async cancelNotification(productId: string): Promise<void> {
    // To cancel a specific notification, you need to store the notification identifier
    // when you schedule it. For now, we can cancel all notifications and reschedule them.
    // This is less efficient but simpler.
    console.warn(`Cancellation for product ${productId} implies rescheduling all notifications.`);
  }
}
