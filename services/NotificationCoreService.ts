// NotificationCoreService.ts — NotificationCoreService module.
//
// exports: NotificationCoreService
// used_by: services\NotificationService.ts
// rules:   Dopo la migrazione a OneSignal, scheduleTestNotification usa OneSignal.Notifications
//          invece di expo-notifications. Le notifiche sono server-side via OneSignal.

import { Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import { LoggingService } from './LoggingService';

export class NotificationCoreService {
  static async scheduleTestNotification(): Promise<void> {
    if (Platform.OS === 'web') return;
    const hasPermission = await OneSignal.Notifications.getPermissionAsync();
    if (!hasPermission) {
      LoggingService.error('NotificationCoreService', 'Cannot schedule test: permission not granted');
      return;
    }
    LoggingService.info('NotificationCoreService', 'OneSignal permission check OK for test notification');
  }
}
