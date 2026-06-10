// OneSignalService.ts — OneSignalService module.
//
// exports: OneSignalUserData | OneSignalService
// used_by: none
// rules:   - State access in OneSignal event listeners must always include a session check from `supabase.auth.getSession()` before using any user data
//          - All OneSignal operations must go through this service class; direct OneSignal SDK calls elsewhere in the codebase are prohibited
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { OneSignal } from 'react-native-onesignal';
import Constants from 'expo-constants';
import { supabase } from './supabaseClient';
import { LoggingService } from './LoggingService';
import { UserDeviceService } from './UserDeviceService';
import { UserNotificationSettingsService } from './UserNotificationSettingsService';

export interface OneSignalUserData {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

type OneSignalOp = () => Promise<any>;

export class OneSignalService {
  private static initializationPromise: Promise<void> | null = null;
  private static opQueue: OneSignalOp[] = [];

  /**
   * Inizializza OneSignal e configura i listener.
   * Gestisce l'inizializzazione asincrona e accoda le operazioni pendenti.
   */
  static async initialize(): Promise<void> {
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = (async () => {
      try {
        LoggingService.info('OneSignalService', 'Initializing OneSignal SDK');
        
        const appId = Constants.expoConfig?.extra?.oneSignalAppId;
        if (!appId) {
          throw new Error('OneSignal App ID not found in expoConfig.extra');
        }

        // Chiamata fondamentale: Inizializza l'SDK con l'App ID
        await OneSignal.initialize(appId);
        LoggingService.info('OneSignalService', 'OneSignal SDK initialize() completed');

        // Configura il listener per il cambiamento dell'ID utente
        OneSignal.User.addEventListener('change', async (event) => {
          try {
            const onesignalId = event.current.onesignalId;
            if (!onesignalId) {
              LoggingService.info('OneSignalService', 'User change event fired but onesignalId is null, skipping.');
              return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              LoggingService.info('OneSignalService', 'OneSignal ID changed → updating user_devices', {
                userId:      session.user.id,
                onesignalId: onesignalId.substring(0, 8) + '...',
              });
              await UserDeviceService.addDevice(session.user.id, onesignalId);
            } else {
              LoggingService.warning('OneSignalService', 'OneSignal ID changed but no active session, skipping device registration.');
            }
          } catch (error) {
            LoggingService.error('OneSignalService', 'Error in OneSignal user change listener', error);
          }
        });

        LoggingService.info('OneSignalService', 'OneSignal service fully initialized');

        // Esegui le operazioni accodate durante l'inizializzazione
        if (this.opQueue.length > 0) {
          LoggingService.info('OneSignalService', `Executing ${this.opQueue.length} queued operations`);
          const queue = [...this.opQueue];
          this.opQueue = [];
          await Promise.allSettled(queue.map(op => op()));
        }

      } catch (error) {
        LoggingService.error('OneSignalService', 'Critical error initializing OneSignal service', error);
        this.initializationPromise = null; // Permetti il retry
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Helper interno per eseguire operazioni di OneSignal solo quando l'SDK è pronto.
   * Se l'SDK non è ancora inizializzato, l'operazione viene accodata.
   */
  private static async execute<T>(op: () => Promise<T>): Promise<T> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      return op();
    }

    // Se non è stata ancora chiamata initialize(), l'invochiamo ora
    // (questo previene crash se initialize non è ancora stata chiamata dal RootLayout)
    await this.initialize();
    return op();
  }

  /**
   * Versione alternativa di execute che accoda l'operazione invece di attendere
   * se l'inizializzazione è in corso. Utile per operazioni non bloccanti (fire-and-forget).
   */
  private static async queueOp(op: OneSignalOp): Promise<void> {
    if (this.initializationPromise) {
      // Se l'inizializzazione è già partita, attendiamo che finisca e poi eseguiamo
      this.initializationPromise.then(() => op().catch(e => LoggingService.error('OneSignalService', 'Queued op failed', e)));
    } else {
      // Altrimenti accodiamo
      this.opQueue.push(op);
    }
  }

  /**
   * Ottiene l'ID OneSignal corrente.
   */
  static async getOneSignalId(): Promise<string | null> {
    try {
      return await this.execute(async () => {
        const onesignalId = await OneSignal.User.getOnesignalId();
        LoggingService.info('OneSignalService', 'Retrieved OneSignal ID', {
          onesignalId: onesignalId ? onesignalId.substring(0, 8) + '...' : null,
        });
        return onesignalId || null;
      });
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error getting OneSignal ID', error);
      return null;
    }
  }

  /**
   * Configura OneSignal per un utente specifico.
   */
  static async configureForUser(userData: OneSignalUserData): Promise<void> {
    try {
      LoggingService.info('OneSignalService', 'Configuring OneSignal for user', { userId: userData.userId });

      await this.execute(async () => {
        // Login OneSignal con l'external user ID (UUID Supabase)
        await OneSignal.login(userData.userId);
        LoggingService.info('OneSignalService', 'OneSignal.login() completed');

        // Imposta i tag utente per targeting futuro
        const tags: Record<string, string> = {
          user_id: userData.userId,
          email:   userData.email || 'no-email@example.com',
        };
        if (userData.firstName) tags.first_name = userData.firstName;
        if (userData.lastName)  tags.last_name  = userData.lastName;
        await OneSignal.User.addTags(tags);
        LoggingService.info('OneSignalService', 'OneSignal tags set');

        // Salva il device_id in user_devices
        const currentOneSignalId = await OneSignal.User.getOnesignalId();
        if (currentOneSignalId) {
          await UserDeviceService.addDevice(userData.userId, currentOneSignalId);
          LoggingService.info('OneSignalService', 'Device registered in user_devices');
        } else {
          LoggingService.warning('OneSignalService', 'OneSignal ID not yet available at login time; listener will register it asynchronously.');
        }

        // Garantisce che user_notification_settings esista per questo utente
        await UserNotificationSettingsService.ensureSettings(userData.userId);
        LoggingService.info('OneSignalService', 'user_notification_settings ensured');
      });

      LoggingService.info('OneSignalService', 'OneSignal configured successfully for user');
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error configuring OneSignal for user', error);
      throw error;
    }
  }

  /**
   * Richiede i permessi per le notifiche push.
   */
  static async requestPermission(): Promise<void> {
    try {
      await this.execute(async () => {
        await OneSignal.Notifications.requestPermission(true);
        LoggingService.info('OneSignalService', 'Notification permission requested');
      });
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error requesting notification permission', error);
      throw error;
    }
  }

  /**
   * Effettua il logout da OneSignal e rimuove il dispositivo dal database.
   */
  static async logout(): Promise<void> {
    try {
      LoggingService.info('OneSignalService', 'Starting OneSignal logout');

      const { data: { session } } = await supabase.auth.getSession();
      
      // Usiamo queueOp per il logout perché spesso è chiamato durante l'uscita dell'app 
      // o in contesti dove non vogliamo bloccare il thread principale.
      await this.execute(async () => {
        const onesignalId = await OneSignal.User.getOnesignalId();

        if (session?.user && onesignalId) {
          await UserDeviceService.removeDevice(session.user.id, onesignalId);
          LoggingService.info('OneSignalService', 'Device removed from user_devices');
        } else {
          LoggingService.warning('OneSignalService', 'Cannot remove device: user or onesignalId missing', {
            hasSession:    !!session?.user,
            hasOnesignalId: !!onesignalId,
          });
        }

        await OneSignal.logout();
        LoggingService.info('OneSignalService', 'OneSignal logout successful');
      });
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error during OneSignal logout', error);
      throw error;
    }
  }
}
