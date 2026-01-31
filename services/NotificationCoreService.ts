/**
 * Notification Core Service
 * 
 * Handles core notification operations including:
 * - Scheduling expiration notifications for products
 * - Canceling scheduled notifications
 * - Scheduling test notifications
 * - Checking notification status
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Product } from '@/types/Product';
import { LoggingService } from './LoggingService';
import { NotificationPermissionService } from './NotificationPermissionService';

/**
 * Constants for notification configuration
 */
const NOTIFICATION_HOUR = 9; // Hour to trigger notifications (9 AM)
const NOTIFICATION_MINUTE = 0;
const NOTIFICATION_SECOND = 0;

/**
 * Interface for scheduled notification content
 */
interface NotificationContent {
  title: string;
  body: string;
  data?: { [key: string]: unknown };
}

/**
 * Validates if a product has a valid expiration date
 * 
 * @param product - Product to validate
 * @returns true if product has a valid expiration date
 */
function hasValidExpirationDate(product: Product): boolean {
  if (!product.expirationDate) {
    return false;
  }

  // Check date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}/.test(product.expirationDate)) {
      LoggingService.warning(
        'NotificationCoreService',
        `Invalid date format for product ${product.id}: ${product.expirationDate}`
      );
    return false;
  }

  return true;
}

/**
 * Parses and validates an expiration date string
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @param productId - Product ID for logging
 * @returns Date object set to notification time (9 AM local), or null if invalid
 */
function parseExpirationDate(dateString: string, productId: string): Date | null {
  try {
    const datePart = dateString.split('T')[0];
    const parts = datePart.split('-');

    if (parts.length !== 3) {
      throw new Error(`Invalid date parts: ${datePart}`);
    }

    const [year, month, day] = parts.map(Number);

    // Validate numeric components
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error(`Invalid date components: year=${year}, month=${month}, day=${day}`);
    }

    // Validate reasonable ranges
    if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`Date values out of range: year=${year}, month=${month}, day=${day}`);
    }

    // Create date at notification time (9 AM local)
    const expirationDate = new Date(year, month - 1, day, NOTIFICATION_HOUR, NOTIFICATION_MINUTE, NOTIFICATION_SECOND);

    // Verify the date is valid
    if (isNaN(expirationDate.getTime())) {
      throw new Error(`Resulting date is invalid: ${expirationDate}`);
    }

    return expirationDate;
  } catch (error: unknown) {
    LoggingService.error(
      'NotificationCoreService', 
      `Error parsing expiration date for product ${productId}:`, 
      error
    );
    return null;
  }
}

/**
 * Service for core notification operations
 */
export class NotificationCoreService {
  /**
   * Cancel all notifications for a specific product
   * Cancels both the main expiration notification and the pre-warning notification.
   * 
   * @param productId - ID of the product whose notifications should be canceled
   */
  static async cancelNotification(productId: string): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    // Check availability (uses cache)
    if (!NotificationPermissionService.checkExpoNotificationsAvailability()) {
      LoggingService.error(
        'NotificationCoreService', 
        'Cannot cancel notification: Expo Notifications not available'
      );
      return;
    }

    LoggingService.info(
      'NotificationCoreService', 
      `Received cancellation request for product ID: ${productId}`
    );

    const notificationId = productId;
    const preWarningNotificationId = `${productId}-pre`;

    // Cancel main notification
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      LoggingService.info(
        'NotificationCoreService', 
        `SUCCESS: Main notification ${notificationId} cancelled.`
      );
    } catch (error: unknown) {
      // Not an error - notification may not exist
      LoggingService.info(
        'NotificationCoreService', 
        `INFO: Could not cancel main notification ${notificationId} (may not exist).`
      );
    }

    // Cancel pre-warning notification
    try {
      await Notifications.cancelScheduledNotificationAsync(preWarningNotificationId);
      LoggingService.info(
        'NotificationCoreService', 
        `SUCCESS: Pre-warning notification ${preWarningNotificationId} cancelled.`
      );
    } catch (error: unknown) {
      LoggingService.info(
        'NotificationCoreService', 
        `INFO: Could not cancel pre-warning notification ${preWarningNotificationId} (may not exist).`
      );
    }
  }

  /**
   * Schedule expiration and pre-warning notifications for a product
   * 
   * @param product - Product to schedule notifications for
   * @param notificationDays - Number of days before expiration to send pre-warning (0 for no pre-warning)
   */
  static async scheduleExpirationNotification(
    product: Product, 
    notificationDays: number
  ): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    // Validate product has expiration date
    if (!hasValidExpirationDate(product)) {
      LoggingService.info(
        'NotificationCoreService', 
        `SKIPPING notification for "${product.name}" (ID: ${product.id}) because it has no expiration date.`
      );
      return;
    }

    // Check availability (uses cache)
    if (!NotificationPermissionService.checkExpoNotificationsAvailability()) {
      LoggingService.error(
        'NotificationCoreService', 
        'Cannot schedule notification: Expo Notifications not available'
      );
      return;
    }

    LoggingService.info(
      'NotificationCoreService', 
      `--- Starting scheduling for product: "${product.name}" (ID: ${product.id}) ---`
    );
    LoggingService.info('NotificationCoreService', `Raw expiration date from DB: ${product.expirationDate}`);
    LoggingService.info('NotificationCoreService', `Notification days setting: ${notificationDays}`);

    const now = new Date();
    LoggingService.info('NotificationCoreService', `Current time is: ${now.toISOString()}`);

    // Parse and validate expiration date
    const expirationDate = parseExpirationDate(product.expirationDate!, product.id!);
    if (!expirationDate) {
      return;
    }

    LoggingService.info(
      'NotificationCoreService', 
      `Constructed expiration date (local ${NOTIFICATION_HOUR} AM): ${expirationDate.toISOString()}`
    );

    // Schedule expiration day notification
    if (expirationDate > now) {
      await this.scheduleSingleNotification({
        identifier: product.id!,
        date: expirationDate,
        content: {
          title: 'Prodotto Scaduto!',
          body: `Il prodotto "${product.name}" è scaduto oggi.`,
          data: { productId: product.id },
        },
      });
    } else {
      LoggingService.info(
        'NotificationCoreService', 
        `SKIPPING expiration notification because the target time ${expirationDate.toISOString()} is in the past.`
      );
    }

    // Schedule pre-warning notification
    if (notificationDays > 0) {
      const preWarningDate = new Date(expirationDate);
      preWarningDate.setDate(preWarningDate.getDate() - notificationDays);
      
      LoggingService.info(
        'NotificationCoreService', 
        `Constructed pre-warning date: ${preWarningDate.toISOString()}`
      );

      if (preWarningDate > now) {
        await this.scheduleSingleNotification({
          identifier: `${product.id}-pre`,
          date: preWarningDate,
          content: {
            title: 'Prodotto in Scadenza',
            body: `Il prodotto "${product.name}" scadrà tra ${notificationDays} giorni.`,
            data: { productId: product.id },
          },
        });
      } else {
        LoggingService.info(
          'NotificationCoreService', 
          `SKIPPING pre-warning notification because the target time ${preWarningDate.toISOString()} is in the past.`
        );
      }
    }

    LoggingService.info(
      'NotificationCoreService', 
      `--- Finished scheduling for product: "${product.name}" ---`
    );
  }

  /**
   * Schedule a single notification
   * 
   * @param options - Notification scheduling options
   */
  private static async scheduleSingleNotification(options: {
    identifier: string;
    date: Date;
    content: NotificationContent;
  }): Promise<void> {
    const { identifier, date, content } = options;

    LoggingService.info(
      'NotificationCoreService', 
      `Scheduling notification with ID: ${identifier} for ${date.toISOString()}`
    );

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: content.data,
        },
        trigger: { 
          type: SchedulableTriggerInputTypes.DATE, 
          date 
        },
        identifier,
      });
      
      LoggingService.info(
        'NotificationCoreService', 
        `SUCCESS: Notification scheduled with ID ${identifier}.`
      );
    } catch (error: unknown) {
      LoggingService.error(
        'NotificationCoreService', 
        `ERROR scheduling notification with ID ${identifier}:`, 
        error
      );
    }
  }

  /**
   * Schedule a test notification to verify notifications are working
   * The notification will trigger 10 seconds after scheduling.
   */
  static async scheduleTestNotification(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    // Check availability (uses cache)
    if (!NotificationPermissionService.checkExpoNotificationsAvailability()) {
      LoggingService.error(
        'NotificationCoreService', 
        'Cannot schedule test notification: Expo Notifications not available'
      );
      return;
    }

    const date = new Date(Date.now() + 10 * 1000); // 10 seconds from now
    LoggingService.info(
      'NotificationCoreService', 
      `Scheduling TEST notification to trigger at ${date.toISOString()}.`
    );

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Notifica di Prova',
          body: 'Se vedi questo messaggio, le notifiche funzionano correttamente!',
          data: { test: 'true' },
        },
        trigger: { 
          type: SchedulableTriggerInputTypes.DATE, 
          date 
        },
      });
      
      LoggingService.info('NotificationCoreService', 'SUCCESS: Test notification scheduled.');
    } catch (error: unknown) {
      LoggingService.error('NotificationCoreService', 'ERROR scheduling test notification:', error);
    }
  }

  /**
   * Check if notifications are scheduled for a specific product
   * 
   * @param productId - ID of the product to check
   * @returns true if either expiration or pre-warning notification is scheduled
   */
  static async isNotificationScheduled(productId: string): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    // Check availability (uses cache)
    if (!NotificationPermissionService.checkExpoNotificationsAvailability()) {
      LoggingService.error(
        'NotificationCoreService', 
        'Cannot check scheduled notifications: Expo Notifications not available'
      );
      return false;
    }

    try {
      const mainIdentifier = productId;
      const preWarningIdentifier = `${productId}-pre`;

      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      const mainNotification = scheduledNotifications.find(n => n.identifier === mainIdentifier);
      const preWarningNotification = scheduledNotifications.find(n => n.identifier === preWarningIdentifier);

      let logMessage = `[NotificationCoreService] Check for product ${productId}:`;
      let isScheduled = false;

      if (preWarningNotification?.trigger && 'date' in preWarningNotification.trigger) {
        const date = new Date(preWarningNotification.trigger.date);
        logMessage += ` Pre-warning SCHEDULED for ${date.toLocaleDateString('it-IT')}.`;
        isScheduled = true;
      }

      if (mainNotification?.trigger && 'date' in mainNotification.trigger) {
        const date = new Date(mainNotification.trigger.date);
        logMessage += ` Expiration SCHEDULED for ${date.toLocaleDateString('it-IT')}.`;
        isScheduled = true;
      }

      if (!isScheduled) {
        logMessage += ` NOT SCHEDULED.`;
      }

      LoggingService.info('NotificationCoreService', logMessage);
      return isScheduled;

    } catch (error: unknown) {
      LoggingService.error(
        'NotificationCoreService', 
        `Error checking scheduled notification for product ${productId}:`, 
        error
      );
      return false; // Safer to return false on error
    }
  }
}
