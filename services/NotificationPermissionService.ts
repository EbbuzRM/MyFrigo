// NotificationPermissionService.ts — NotificationPermissionService module.
//
// exports: NotificationPermissionService
// used_by: services\NotificationCoreService.ts
//         services\NotificationService.ts
// rules:   - Permissions are now managed through OneSignal SDK (expo-notifications removed)

import { Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import { LoggingService } from './LoggingService';

export class NotificationPermissionService {
  private static availabilityChecked = false;
  private static availabilityResult = false;

  static checkExpoNotificationsAvailability(): boolean {
    // Simplified: OneSignal is always available on native platforms
    return Platform.OS !== 'web';
  }

  static clearAvailabilityCache(): void {
    this.availabilityChecked = false;
    this.availabilityResult = false;
  }

  static async getOrRequestPermissionsAsync(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    if (!this.checkExpoNotificationsAvailability()) return false;
    try {
      const hasPermission = await OneSignal.Notifications.getPermissionAsync();
      if (!hasPermission) {
        LoggingService.info('NotificationPermissionService', 'Requesting notification permission via OneSignal...');
        const granted = await OneSignal.Notifications.requestPermission(true);
        LoggingService.info('NotificationPermissionService', `Permission result: ${granted}`);
        return granted;
      }
      LoggingService.info('NotificationPermissionService', 'Permission already granted');
      return true;
    } catch (error: unknown) {
      LoggingService.error('NotificationPermissionService', 'Error requesting permissions:', error);
      return false;
    }
  }

  static async checkPermissionsAsync(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    if (!this.checkExpoNotificationsAvailability()) return false;
    try {
      return await OneSignal.Notifications.getPermissionAsync();
    } catch (error: unknown) {
      LoggingService.error('NotificationPermissionService', 'Error checking permissions:', error);
      return false;
    }
  }
}
