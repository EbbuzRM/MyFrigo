// NotificationService.ts — NotificationService module.
//
// exports: NotificationService | EventEmitter | eventEmitter
// used_by: app\_layout.tsx
//                   context\SettingsContext.tsx
//                   services\diagnostic\NotificationTests.ts
// rules:   Only EventEmitter and eventEmitter exported from EventEmitter are allowed for event-based communication; no other custom events or callback registries should be introduced in this module.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Servizio Notifiche (Facade)
 *
 * Dopo la migrazione alle push server-side (OneSignal + Edge Function),
 * questo servizio mantiene solo:
 *   - initialize(): setup OneSignal
 *   - scheduleTestNotification(): diagnostica
 *
 * Le notifiche push sono gestite interamente da OneSignal SDK a livello nativo.
 * Non serve più setNotificationHandler né la creazione manuale del canale Android:
 * OneSignal crea i propri canali e gestisce il display delle notifiche.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { LoggingService } from './LoggingService';
import { EventEmitter, eventEmitter } from './EventEmitter';
import { NotificationPermissionService } from './NotificationPermissionService';
import { NotificationCoreService } from './NotificationCoreService';
import { OneSignalService } from './OneSignalService';

export class NotificationService {
  private static isInitialized = false;

  /**
   * Inizializza il sistema di notifiche.
   * Configura OneSignal per le notifiche push.
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized || Platform.OS === 'web') {
      return;
    }

    const oneSignalAppId = Constants.expoConfig?.extra?.oneSignalAppId;
    if (!oneSignalAppId) {
      LoggingService.error('NotificationService', 'FATAL: OneSignal App ID not found in app.json.');
      return;
    }

    try {
      // Delega l'inizializzazione al OneSignalService robusto
      await OneSignalService.initialize();
      await OneSignalService.requestPermission();
      
      this.isInitialized = true;
      LoggingService.info('NotificationService', 'OneSignal SDK initialized successfully via OneSignalService.');
    } catch (error: unknown) {
      LoggingService.error('NotificationService', 'Error initializing OneSignal:', error);
    }
  }

  /**
   * Ottieni o richiedi i permessi di notifica.
   * @returns Promise che restituisce true se i permessi sono concessi
   */
  static async getOrRequestPermissionsAsync(): Promise<boolean> {
    return NotificationPermissionService.getOrRequestPermissionsAsync();
  }

  /**
   * Pianifica una notifica di test (si attiva dopo 10 secondi).
   * Utile per verificare che OneSignal e il canale Android funzionino.
   */
  static async scheduleTestNotification(): Promise<void> {
    return NotificationCoreService.scheduleTestNotification();
  }
}

/**
 * Ri-esporta EventEmitter per compatibilità con le versioni precedenti.
 * @deprecated Importa direttamente da './EventEmitter'
 */
export { EventEmitter, eventEmitter };
