/**
 * Servizio Notifiche Core
 * 
 * Gestisce le operazioni di notifica core incluse:
 * - Pianificazione notifiche di scadenza per i prodotti
 * - Cancellazione notifiche pianificate
 * - Pianificazione notifiche di test
 * - Verifica stato notifiche
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Product } from '@/types/Product';
import { LoggingService } from './LoggingService';
import { NotificationPermissionService } from './NotificationPermissionService';

/**
 * Costanti per la configurazione delle notifiche
 */
const NOTIFICATION_HOUR = 9; // Ora di attivazione notifiche (9:00)
const NOTIFICATION_MINUTE = 0;
const NOTIFICATION_SECOND = 0;

/**
 * Interfaccia per il contenuto della notifica pianificata
 */
interface NotificationContent {
  title: string;
  body: string;
  data?: { [key: string]: unknown };
}

/**
 * Verifica se un prodotto ha una data di scadenza valida
 * 
 * @param product - Prodotto da validare
 * @returns true se il prodotto ha una data di scadenza valida
 */
function hasValidExpirationDate(product: Product): boolean {
  if (!product.expirationDate) {
    return false;
  }

  // Verifica formato data (YYYY-MM-DD)
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
 * Analizza e valida una stringa di data di scadenza
 * 
 * @param dateString - Stringa data in formato YYYY-MM-DD
 * @param productId - ID prodotto per il logging
 * @returns Oggetto Date impostato all'ora di notifica (9:00 locali), o null se non valido
 */
function parseExpirationDate(dateString: string, productId: string): Date | null {
  try {
    const datePart = dateString.split('T')[0];
    const parts = datePart.split('-');

    if (parts.length !== 3) {
      throw new Error(`Parti data non valide: ${datePart}`);
    }

    const [year, month, day] = parts.map(Number);

    // Valida componenti numerici
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error(`Componenti data non validi: anno=${year}, mese=${month}, giorno=${day}`);
    }

    // Valita intervalli ragionevoli
    if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`Valori data fuori intervallo: anno=${year}, mese=${month}, giorno=${day}`);
    }

    // Crea data all'ora di notifica (9:00 locali)
    const expirationDate = new Date(year, month - 1, day, NOTIFICATION_HOUR, NOTIFICATION_MINUTE, NOTIFICATION_SECOND);

    // Verifica che la data sia valida
    if (isNaN(expirationDate.getTime())) {
      throw new Error(`La data risultante non è valida: ${expirationDate}`);
    }

    return expirationDate;
  } catch (error: unknown) {
    LoggingService.error(
      'NotificationCoreService', 
      `Errore analisi data scadenza per prodotto ${productId}:`, 
      error
    );
    return null;
  }
}

/**
 * Servizio per le operazioni di notifica core
 */
export class NotificationCoreService {
  /**
   * Cancella tutte le notifiche per un prodotto specifico
   * Cancella sia la notifica di scadenza principale che quella di pre-avviso.
   * 
   * @param productId - ID del prodotto di cui cancellare le notifiche
   */
  static async cancelNotification(productId: string): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    // Verifica disponibilità (usa cache)
    if (!NotificationPermissionService.checkExpoNotificationsAvailability()) {
      LoggingService.error(
        'NotificationCoreService', 
        'Impossibile cancellare notifica: Expo Notifications non disponibile'
      );
      return;
    }

    LoggingService.info(
      'NotificationCoreService', 
      `Ricevuta richiesta cancellazione per ID prodotto: ${productId}`
    );

    const notificationId = productId;
    const preWarningNotificationId = `${productId}-pre`;

    // Cancella notifica principale
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      LoggingService.info(
        'NotificationCoreService', 
        `SUCCESSO: Notifica principale ${notificationId} cancellata.`
      );
    } catch (error: unknown) {
      // Non è un errore - la notifica potrebbe non esistere
      LoggingService.info(
        'NotificationCoreService', 
        `INFO: Impossibile cancellare notifica principale ${notificationId} (potrebbe non esistere).`
      );
    }

    // Cancella notifica di pre-avviso
    try {
      await Notifications.cancelScheduledNotificationAsync(preWarningNotificationId);
      LoggingService.info(
        'NotificationCoreService', 
        `SUCCESSO: Notifica pre-avviso ${preWarningNotificationId} cancellata.`
      );
    } catch (error: unknown) {
      LoggingService.info(
        'NotificationCoreService', 
        `INFO: Impossibile cancellare notifica pre-avviso ${preWarningNotificationId} (potrebbe non esistere).`
      );
    }
  }

  /**
   * Pianifica le notifiche di scadenza e pre-avviso per un prodotto
   * 
   * @param product - Prodotto per cui pianificare le notifiche
   * @param notificationDays - Numero di giorni prima della scadenza per inviare il pre-avviso (0 per nessun pre-avviso)
   */
  static async scheduleExpirationNotification(
    product: Product, 
    notificationDays: number
  ): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    // Valida che il prodotto abbia una data di scadenza
    if (!hasValidExpirationDate(product)) {
      LoggingService.info(
        'NotificationCoreService', 
        `SALTO notifica per "${product.name}" (ID: ${product.id}) perché non ha data di scadenza.`
      );
      return;
    }

    // Verifica disponibilità (usa cache)
    if (!NotificationPermissionService.checkExpoNotificationsAvailability()) {
      LoggingService.error(
        'NotificationCoreService', 
        'Impossibile pianificare notifica: Expo Notifications non disponibile'
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

    // Analizza e valida la data di scadenza
    const expirationDate = parseExpirationDate(product.expirationDate!, product.id!);
    if (!expirationDate) {
      return;
    }

    LoggingService.info(
      'NotificationCoreService', 
      `Costruita data scadenza (locale ${NOTIFICATION_HOUR}:00): ${expirationDate.toISOString()}`
    );

    // Pianifica notifica giorno di scadenza
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
        `SALTO notifica scadenza perché l'ora target ${expirationDate.toISOString()} è nel passato.`
      );
    }

    // Pianifica notifica di pre-avviso
    if (notificationDays > 0) {
      const preWarningDate = new Date(expirationDate);
      preWarningDate.setDate(preWarningDate.getDate() - notificationDays);
      
      LoggingService.info(
        'NotificationCoreService', 
        `Costruita data pre-avviso: ${preWarningDate.toISOString()}`
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
          `SALTO notifica pre-avviso perché l'ora target ${preWarningDate.toISOString()} è nel passato.`
        );
      }
    }

    LoggingService.info(
      'NotificationCoreService', 
      `--- Terminata pianificazione per prodotto: "${product.name}" ---`
    );
  }

  /**
   * Pianifica una singola notifica
   * 
   * @param options - Opzioni di pianificazione notifica
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
