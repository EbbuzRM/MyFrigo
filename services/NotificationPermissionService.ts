/**
 * Notification Permission Service
 * 
 * Handles all permission-related operations for notifications including:
 * - Checking notification permissions
 * - Requesting permissions from the user
 * - Caching availability checks to avoid repeated native calls
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { LoggingService } from './LoggingService';

/**
 * Interface for permission request options
 */
interface PermissionRequestOptions {
  ios?: {
    allowAlert?: boolean;
    allowBadge?: boolean;
    allowSound?: boolean;
    provideAppNotificationSettings?: boolean;
  };
}

/**
 * Service for managing notification permissions
 */
export class NotificationPermissionService {
  /** Cache flag indicating if availability has been checked */
  private static availabilityChecked = false;
  
  /** Cached result of the availability check */
  private static availabilityResult = false;

  /**
   * Verifies if Expo Notifications is available and properly linked.
   * Results are cached to avoid repeated native module checks.
   * 
   * @returns true if Expo Notifications is available, false otherwise
   */
  static checkExpoNotificationsAvailability(): boolean {
    // Return cached result if already checked
    if (this.availabilityChecked) {
      return this.availabilityResult;
    }

    if (Platform.OS === 'web') {
      this.availabilityChecked = true;
      this.availabilityResult = false;
      return false;
    }

    try {
      // Verify that the main Expo Notifications functions are available
      if (!Notifications ||
        typeof Notifications.scheduleNotificationAsync !== 'function' ||
        typeof Notifications.cancelScheduledNotificationAsync !== 'function') {
        LoggingService.error(
          'NotificationPermissionService', 
          'Expo Notifications API not available or not properly linked'
        );
        this.availabilityChecked = true;
        this.availabilityResult = false;
        return false;
      }

      this.availabilityChecked = true;
      this.availabilityResult = true;
      return true;
    } catch (error: unknown) {
      LoggingService.error(
        'NotificationPermissionService', 
        'Error checking Expo Notifications availability:', 
        error
      );
      this.availabilityChecked = true;
      this.availabilityResult = false;
      return false;
    }
  }

  /**
   * Clear the availability cache to force a recheck on next call.
   * Useful for testing or when the native module state may have changed.
   */
  static clearAvailabilityCache(): void {
    this.availabilityChecked = false;
    this.availabilityResult = false;
  }

  /**
   * Check if permissions are already granted, or request them if not.
   * 
   * @returns Promise resolving to true if permissions are granted
   */
  static async getOrRequestPermissionsAsync(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    // Check availability (uses cache)
    if (!this.checkExpoNotificationsAvailability()) {
      LoggingService.error(
        'NotificationPermissionService', 
        'Cannot check permissions: Expo Notifications not available'
      );
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        LoggingService.info('NotificationPermissionService', 'Permissions not granted, requesting...');
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
        LoggingService.info('NotificationPermissionService', 'Permission request denied or failed.');
        return false;
      }

      LoggingService.info('NotificationPermissionService', 'Permissions are granted.');
      return true;
    } catch (error: unknown) {
      LoggingService.error('NotificationPermissionService', 'Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Check if notification permissions are granted without requesting them.
   * 
   * @returns Promise resolving to true if permissions are granted
   */
  static async checkPermissionsAsync(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    if (!this.checkExpoNotificationsAvailability()) {
      return false;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error: unknown) {
      LoggingService.error('NotificationPermissionService', 'Error checking permissions:', error);
      return false;
    }
  }
}
