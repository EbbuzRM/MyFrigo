// NotificationCoreService.ts — NotificationCoreService module.
//
// exports: NotificationCoreService
// used_by: services\NotificationService.ts
// rules:   Le notifiche sono server-side via OneSignal; questo controllo non le invia.

import { Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import { LoggingService } from './LoggingService';

export class NotificationCoreService {
  static async checkNotificationReadiness(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const hasPermission = await OneSignal.Notifications.getPermissionAsync();
    if (!hasPermission) {
      LoggingService.warning('NotificationCoreService', 'Notification permission not granted');
      return false;
    }
    LoggingService.info('NotificationCoreService', 'OneSignal notification permission granted');
    return true;
  }
}
