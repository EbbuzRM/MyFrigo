/**
 * Servizio Notifiche Batch
 * 
 * Gestisce le operazioni batch per le notifiche incluse:
 * - Pianificazione di più notifiche in modo efficiente in batch
 * - Elaborazione di liste grandi di prodotti con concorrenza controllata
 */

import { Platform } from 'react-native';
import { Product } from '@/types/Product';
import { AppSettings } from './SettingsService';
import { LoggingService } from './LoggingService';
import { NotificationCoreService } from './NotificationCoreService';
import { NotificationPermissionService } from './NotificationPermissionService';

/**
 * Costanti per l'elaborazione batch
 */
const DEFAULT_BATCH_SIZE = 5;

/**
 * Interfaccia per le opzioni di elaborazione batch
 */
interface BatchOptions {
  /** Numero di elementi da elaborare in parallelo (default: 5) */
  batchSize?: number;
  /** Numero di giorni prima della scadenza per inviare il pre-avviso */
  notificationDays: number;
}

/**
 * Interfaccia per i risultati dell'elaborazione batch
 */
interface BatchResult {
  /** Numero totale di prodotti elaborati */
  totalProcessed: number;
  /** Numero di notifiche pianificate con successo */
  successCount: number;
  /** Numero di notifiche fallite */
  failureCount: number;
  /** Numero di batch creati */
  batchCount: number;
}

/**
 * Servizio per le operazioni batch delle notifiche
 */
export class NotificationBatchService {
  /**
   * Pianifica le notifiche per più prodotti in batch ottimizzati.
   * Elabora i prodotti in parallelo all'interno di ogni batch per migliorare le performance
   * evitando di sovraccaricare il sistema di notifiche nativo.
   * 
   * @param products - Array di prodotti per cui pianificare le notifiche
   * @param settings - Impostazioni app contenenti la configurazione notificationDays
   * @returns Promise che si risolve quando tutti i batch sono elaborati
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

    // Valida input
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

    // Dividi i prodotti in batch
    for (let i = 0; i < products.length; i += batchSize) {
      batches.push(products.slice(i, i + batchSize));
    }

    LoggingService.info(
      'NotificationBatchService',
      `Pianificazione notifiche per ${products.length} prodotti in ${batches.length} batch (dimensione: ${batchSize})`
    );

    // Elabora i batch sequenzialmente, ma elabora gli elementi all'interno di ogni batch in parallelo
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
                `Errore pianificazione notifica per prodotto ${product.id} nel batch ${batchIndex + 1}:`,
                error
              );
            })
          )
        );

        LoggingService.info(
          'NotificationBatchService',
          `Completato batch ${batchIndex + 1}/${batches.length} (${batch.length} prodotti)`
        );
      } catch (error: unknown) {
        // Questo non dovrebbe accadere per i catch individuali, ma gestisci comunque
        LoggingService.error(
          'NotificationBatchService',
          `Errore imprevisto elaborazione batch ${batchIndex + 1}:`,
          error
        );
      }
    }

    LoggingService.info(
      'NotificationBatchService',
      `Terminata pianificazione notifiche per ${products.length} prodotti in ${batches.length} batch`
    );
  }

  /**
   * Cancella le notifiche per più prodotti
   * 
   * @param productIds - Array di ID prodotti per cui cancellare le notifiche
   * @returns Promise che si risolve quando tutte le cancellazioni sono completate
   */
  static async cancelMultipleNotifications(productIds: string[]): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    if (!productIds || productIds.length === 0) {
      return;
    }

    // Verifica disponibilità (usa cache)
    if (!NotificationPermissionService.checkExpoNotificationsAvailability()) {
      LoggingService.error(
        'NotificationBatchService',
        'Impossibile cancellare notifiche multiple: Expo Notifications non disponibile'
      );
      return;
    }

    LoggingService.info(
      'NotificationBatchService',
      `Cancellazione notifiche per ${productIds.length} prodotti`
    );

    // Cancella tutte le notifiche in parallelo
    await Promise.all(
      productIds.map(productId =>
        NotificationCoreService.cancelNotification(productId).catch((error: unknown) => {
          LoggingService.error(
            'NotificationBatchService',
            `Errore cancellazione notifica per prodotto ${productId}:`,
            error
          );
        })
      )
    );

    LoggingService.info(
      'NotificationBatchService',
      `Terminata cancellazione notifiche per ${productIds.length} prodotti`
    );
  }
}
