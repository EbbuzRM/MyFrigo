import { OneSignal } from 'react-native-onesignal';
import { supabase } from './supabaseClient';
import { LoggingService } from './LoggingService';
import { UserDeviceService } from './UserDeviceService';

export interface OneSignalUserData {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export class OneSignalService {
  private static isOneSignalReady = false;

  /**
   * Inizializza OneSignal e configura i listener
   */
  static async initialize(): Promise<void> {
    try {
      LoggingService.info('OneSignalService', 'Initializing OneSignal service');
      
      OneSignal.User.addEventListener('change', async (event) => {
        try {
          const onesignalId = event.current.onesignalId;
          if (onesignalId) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              LoggingService.info('OneSignalService', 'OneSignal User ID changed, updating device list.', { onesignalId });
              await UserDeviceService.addDevice(session.user.id, onesignalId);
            }
          }
        } catch (error) {
          LoggingService.error('OneSignalService', 'Error handling OneSignal user change event', error);
        }
      });

      LoggingService.info('OneSignalService', 'OneSignal service initialized successfully');
      this.isOneSignalReady = true;
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error initializing OneSignal service', error);
      this.isOneSignalReady = false;
      throw error;
    }
  }

  private static async waitForOneSignalInitialization(): Promise<void> {
    if (this.isOneSignalReady) return;
    // Semplice attesa nel caso in cui l'inizializzazione non sia completa
    return new Promise((resolve) => setTimeout(resolve, 2000));
  }

  /**
   * Ottiene l'ID OneSignal corrente
   */
  static async getOneSignalId(): Promise<string | null> {
    try {
      await this.waitForOneSignalInitialization();
      const onesignalId = await OneSignal.User.getOnesignalId();
      LoggingService.info('OneSignalService', 'Retrieved OneSignal ID', { onesignalId });
      return onesignalId || null;
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error getting OneSignal ID', error);
      return null;
    }
  }

  /**
   * Configura OneSignal per un utente specifico
   */
  static async configureForUser(userData: OneSignalUserData): Promise<void> {
    try {
      LoggingService.info('OneSignalService', 'Configuring OneSignal for user', { userId: userData.userId });

      await this.waitForOneSignalInitialization();

      await OneSignal.login(userData.userId);

      const tags: Record<string, string> = {
        user_id: userData.userId,
        email: userData.email || 'no-email@example.com',
      };
      if (userData.firstName) tags.first_name = userData.firstName;
      if (userData.lastName) tags.last_name = userData.lastName;
      await OneSignal.User.addTags(tags);

      const currentOneSignalId = await this.getOneSignalId();
      if (currentOneSignalId) {
        await UserDeviceService.addDevice(userData.userId, currentOneSignalId);
      }

      LoggingService.info('OneSignalService', 'OneSignal configured successfully for user');
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error configuring OneSignal for user', error);
      throw error;
    }
  }

  /**
   * Effettua il logout da OneSignal e rimuove il dispositivo dal database
   */
  static async logout(): Promise<void> {
    try {
      LoggingService.info('OneSignalService', 'Starting logout process from OneSignal');
      
      const { data: { session } } = await supabase.auth.getSession();
      const onesignalId = await this.getOneSignalId();

      if (session?.user && onesignalId) {
        await UserDeviceService.removeDevice(session.user.id, onesignalId);
      } else {
        LoggingService.warning('OneSignalService', 'Could not remove device: user or onesignalId not found.');
      }

      await OneSignal.logout();
      LoggingService.info('OneSignalService', 'OneSignal logout successful');
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error during OneSignal logout', error);
      throw error;
    }
  }
}