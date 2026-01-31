/**
 * Notification Batch Service
 * 
 * Handles batch operations for notifications including:
 * - Scheduling multiple notifications efficiently in batches
 * - Processing large product lists with controlled concurrency
 */

import { Platform } from 'react-native';
import { Product } from '@/types/Product';
import { AppSettings } from './SettingsService';
import { LoggingService } from './LoggingService';
import { NotificationCoreService } from './NotificationCoreService';
import { NotificationPermissionService } from './NotificationPermissionService';

/**
 * Constants for batch processing
 */
const DEFAULT_BATCH_SIZE = 5;

/**
 * Interface for batch processing options
 */
interface BatchOptions {
  /** Number of items to process in parallel (default: 5) */
  batchSize?: number;
  /** Number of days before expiration to send pre-warning */
  notificationDays: number;
}

/**
 * Interface for batch processing results
 */
interface BatchResult {
  /** Total number of products processed */
  totalProcessed: number;
  /** Number of successful notifications scheduled */
  successCount: number;
  /** Number of failed notifications */
  failureCount: number;
  /** Number of batches created */
  batchCount: number;
}

/**
 * Service for batch notification operations
 */
export class NotificationBatchService {
  /**
   * Schedule notifications for multiple products in optimized batches.
   * Processes products in parallel within each batch to improve performance
   * while avoiding overwhelming the native notification system.
   * 
   * @param products - Array of products to schedule notifications for
   * @param settings - App settings containing notificationDays configuration
   * @returns Promise resolving when all batches are processed
   * 
   * @example
   * ```typescript
   * await NotificationBatchService.scheduleMultipleNotifications(
   *   products, 
   *   { notificationDays: 3 }
   * );
   * ```
   */
  static async scheduleMultipleNotifications(
    products: Product[],
    settings: AppSettings
  ): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    // Check availability (uses cache)
    if (!NotificationPermissionService.checkExpoNotificationsAvailability()) {
      LoggingService.error(
        'NotificationBatchService',
        'Cannot schedule multiple notifications: Expo Notifications not available'
      );
      return;
    }

    // Validate input
    if (!products || products.length === 0) {
      LoggingService.info('NotificationBatchService', 'No products to schedule notifications for');
      return;
    }

    if (!settings || typeof settings.notificationDays !== 'number') {
      LoggingService.error(
        'NotificationBatchService',
        'Invalid settings provided: notificationDays must be a number'
      );
      return;
    }

    const batchSize = DEFAULT_BATCH_SIZE;
    const batches: Product[][] = [];

    // Split products into batches
    for (let i = 0; i < products.length; i += batchSize) {
      batches.push(products.slice(i, i + batchSize));
    }

    LoggingService.info(
      'NotificationBatchService',
      `Scheduling notifications for ${products.length} products in ${batches.length} batches (size: ${batchSize})`
    );

    // Process batches sequentially, but process items within each batch in parallel
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      try {
        await Promise.all(
          batch.map(product =>
            NotificationCoreService.scheduleExpirationNotification(
              product,
              settings.notificationDays
            ).catch((error: unknown) => {
              LoggingService.error(
                'NotificationBatchService',
                `Error scheduling notification for product ${product.id} in batch ${batchIndex + 1}:`,
                error
              );
            })
          )
        );

        LoggingService.info(
          'NotificationBatchService',
          `Completed batch ${batchIndex + 1}/${batches.length} (${batch.length} products)`
        );
      } catch (error: unknown) {
        // This shouldn't happen due to individual catches, but handle just in case
        LoggingService.error(
          'NotificationBatchService',
          `Unexpected error processing batch ${batchIndex + 1}:`,
          error
        );
      }
    }

    LoggingService.info(
      'NotificationBatchService',
      `Finished scheduling notifications for ${products.length} products in ${batches.length} batches`
    );
  }

  /**
   * Cancel notifications for multiple products
   * 
   * @param productIds - Array of product IDs to cancel notifications for
   * @returns Promise resolving when all cancellations are complete
   */
  static async cancelMultipleNotifications(productIds: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    if (!productIds || productIds.length === 0) {
      return;
    }

    // Check availability (uses cache)
    if (!NotificationPermissionService.checkExpoNotificationsAvailability()) {
      LoggingService.error(
        'NotificationBatchService',
        'Cannot cancel multiple notifications: Expo Notifications not available'
      );
      return;
    }

    LoggingService.info(
      'NotificationBatchService',
      `Cancelling notifications for ${productIds.length} products`
    );

    // Cancel all notifications in parallel
    await Promise.all(
      productIds.map(productId =>
        NotificationCoreService.cancelNotification(productId).catch((error: unknown) => {
          LoggingService.error(
            'NotificationBatchService',
            `Error cancelling notification for product ${productId}:`,
            error
          );
        })
      )
    );

    LoggingService.info(
      'NotificationBatchService',
      `Finished cancelling notifications for ${productIds.length} products`
    );
  }
}
