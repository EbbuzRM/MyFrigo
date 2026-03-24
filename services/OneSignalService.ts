import { OneSignal } from 'react-native-onesignal';
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

export class OneSignalService {
  private static isOneSignalReady = false;

  /**
   * Inizializza OneSignal e configura i listener.
   * Il listener 'change' garantisce che il device_id venga sempre salvato
   * anche quando l'ID OneSignal viene assegnato in modo asincrono.
   */
  static async initialize(): Promise<void> {
    try {
      LoggingService.info('OneSignalService', 'Initializing OneSignal service');

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

      this.isOneSignalReady = true;
      LoggingService.info('OneSignalService', 'OneSignal service initialized successfully');
    } catch (error) {
      this.isOneSignalReady = false;
      LoggingService.error('OneSignalService', 'Error initializing OneSignal service', error);
      throw error;
    }
  }

  private static async waitForOneSignalInitialization(): Promise<void> {
    if (this.isOneSignalReady) return;
    LoggingService.info('OneSignalService', 'Waiting for OneSignal initialization...');
    return new Promise((resolve) => setTimeout(resolve, 2000));
  }

  /**
   * Ottiene l'ID OneSignal corrente (può essere null se non ancora assegnato).
   */
  static async getOneSignalId(): Promise<string | null> {
    try {
      await this.waitForOneSignalInitialization();
      const onesignalId = await OneSignal.User.getOnesignalId();
      LoggingService.info('OneSignalService', 'Retrieved OneSignal ID', {
        onesignalId: onesignalId ? onesignalId.substring(0, 8) + '...' : null,
      });
      return onesignalId || null;
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error getting OneSignal ID', error);
      return null;
    }
  }

  /**
   * Configura OneSignal per un utente specifico.
   *
   * Chiamato al login: esegue OneSignal.login(), imposta i tag,
   * salva il device in user_devices e garantisce che user_notification_settings
   * esista per questo utente.
   */
  static async configureForUser(userData: OneSignalUserData): Promise<void> {
    try {
      LoggingService.info('OneSignalService', 'Configuring OneSignal for user', { userId: userData.userId });

      await this.waitForOneSignalInitialization();

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
      const currentOneSignalId = await this.getOneSignalId();
      if (currentOneSignalId) {
        await UserDeviceService.addDevice(userData.userId, currentOneSignalId);
        LoggingService.info('OneSignalService', 'Device registered in user_devices');
      } else {
        // L'ID potrebbe non essere ancora disponibile: il listener 'change' lo gestirà
        LoggingService.warning('OneSignalService', 'OneSignal ID not yet available at login time; listener will register it asynchronously.');
      }

      // Garantisce che user_notification_settings esista per questo utente
      await UserNotificationSettingsService.ensureSettings(userData.userId);
      LoggingService.info('OneSignalService', 'user_notification_settings ensured');

      LoggingService.info('OneSignalService', 'OneSignal configured successfully for user');
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error configuring OneSignal for user', error);
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
      const onesignalId = await this.getOneSignalId();

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
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error during OneSignal logout', error);
      throw error;
    }
  }
}
