/**
 * Notification Service (Facade)
 * 
 * This is a facade/composite service that provides a unified interface
 * to all notification functionality. It delegates to specialized services:
 * - NotificationPermissionService: Permission handling
 * - NotificationCoreService: Core scheduling and canceling
 * - NotificationBatchService: Batch operations
 * - EventEmitter: Event system (re-exported)
 * 
 * All public methods maintain backward compatibility with the original API.
 */

import { Platform } from 'react-native';
import { OneSignal } from 'react-native-onesignal';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Product } from '@/types/Product';
import { AppSettings } from './SettingsService';
import { LoggingService } from './LoggingService';
import { EventEmitter, eventEmitter } from './EventEmitter';
import { NotificationPermissionService } from './NotificationPermissionService';
import { NotificationCoreService } from './NotificationCoreService';
import { NotificationBatchService } from './NotificationBatchService';

/**
 * Configure notification handler for Expo Notifications
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Notification Service - Facade for all notification operations
 * 
 * This class provides backward-compatible access to all notification
 * functionality while delegating to specialized internal services.
 */
export class NotificationService {
  private static isInitialized = false;

  /**
   * Initialize the notification system.
   * Sets up OneSignal for push notifications and creates Android notification channels.
   */
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
      // Create notification channel for Android
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
    } catch (error: unknown) {
      LoggingService.error('NotificationService', 'Error initializing OneSignal:', error);
    }
  }

  /**
   * Check if Expo Notifications is available.
   * Uses cached result for performance.
   * 
   * @returns true if Expo Notifications is available
   * @deprecated Use NotificationPermissionService.checkExpoNotificationsAvailability() instead
   */
  static checkExpoNotificationsAvailability(): boolean {
    return NotificationPermissionService.checkExpoNotificationsAvailability();
  }

  /**
   * Cancel all notifications for a specific product.
   * Cancels both the expiration notification and pre-warning notification.
   * 
   * @param productId - ID of the product
   */
  static async cancelNotification(productId: string): Promise<void> {
    return NotificationCoreService.cancelNotification(productId);
  }

  /**
   * Schedule expiration and pre-warning notifications for a product.
   * 
   * @param product - Product to schedule notifications for
   * @param notificationDays - Days before expiration to send pre-warning (0 for none)
   */
  static async scheduleExpirationNotification(
    product: Product,
    notificationDays: number
  ): Promise<void> {
    return NotificationCoreService.scheduleExpirationNotification(product, notificationDays);
  }

  /**
   * Get current permissions or request them if not granted.
   * 
   * @returns Promise resolving to true if permissions are granted
   */
  static async getOrRequestPermissionsAsync(): Promise<boolean> {
    return NotificationPermissionService.getOrRequestPermissionsAsync();
  }

  /**
   * Schedule a test notification that will trigger after 10 seconds.
   * Useful for verifying notification setup is working.
   */
  static async scheduleTestNotification(): Promise<void> {
    return NotificationCoreService.scheduleTestNotification();
  }

  /**
   * Check if notifications are scheduled for a product.
   * 
   * @param productId - ID of the product to check
   * @returns Promise resolving to true if notifications are scheduled
   */
  static async isNotificationScheduled(productId: string): Promise<boolean> {
    return NotificationCoreService.isNotificationScheduled(productId);
  }

  /**
   * Schedule notifications for multiple products in batches.
   * 
   * @param products - Array of products to schedule
   * @param settings - App settings with notificationDays configuration
   */
  static async scheduleMultipleNotifications(
    products: Product[],
    settings: AppSettings
  ): Promise<void> {
    return NotificationBatchService.scheduleMultipleNotifications(products, settings);
  }
}

/**
 * Re-export EventEmitter for backward compatibility
 * @deprecated Import directly from './EventEmitter' instead
 */
export { EventEmitter, eventEmitter };
