import { OneSignal } from 'react-native-onesignal';
import { supabase } from './supabaseClient';
import { LoggingService } from './LoggingService';

export interface OneSignalUserData {
  userId: string;
  oneSignalId: string | null;
  pushToken: string | null;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export class OneSignalService {
  private static isOneSignalReady = false;
  private static initializationPromise: Promise<void> | null = null;

  /**
   * Verifica se OneSignal è pronto per l'uso
   */
  private static async waitForOneSignalInitialization(): Promise<void> {
    // Se OneSignal è già pronto, ritorna immediatamente
    if (this.isOneSignalReady) {
      return;
    }

    // Se c'è già un'inizializzazione in corso, attendi il completamento
    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }

    // Verifica se OneSignal è disponibile e inizializzato
    try {
      // Controlla se OneSignal è disponibile
      if (!OneSignal || typeof OneSignal.login !== 'function') {
        throw new Error('OneSignal non è disponibile o non è stato inizializzato correttamente');
      }

      // Tenta di ottenere lo stato di OneSignal per verificare se è inizializzato
      const maxRetries = 10;
      const retryDelay = 500; // 500ms

      for (let i = 0; i < maxRetries; i++) {
        try {
          // Tenta di accedere alle funzionalità di OneSignal
          await OneSignal.User.getOnesignalId();
          this.isOneSignalReady = true;
          LoggingService.info('OneSignalService', 'OneSignal è pronto per l\'uso');
          return;
        } catch (error) {
          LoggingService.debug('OneSignalService', `Tentativo ${i + 1}/${maxRetries}: OneSignal non ancora pronto`, error);
          
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }

      throw new Error('OneSignal non è diventato disponibile dopo i tentativi di retry');
    } catch (error) {
      LoggingService.error('OneSignalService', 'Errore durante l\'attesa dell\'inizializzazione di OneSignal', error);
      throw error;
    }
  }

  /**
   * Inizializza OneSignal e configura i listener
   */
  static async initialize(): Promise<void> {
    try {
      LoggingService.info('OneSignalService', 'Initializing OneSignal service');
      
      // Listener per quando l'ID OneSignal cambia
      OneSignal.User.addEventListener('change', (event) => {
        LoggingService.info('OneSignalService', 'OneSignal User ID changed', {
          current: event.current.onesignalId
        });
        
        // Salva automaticamente il nuovo ID se c'è un utente loggato
        this.saveOneSignalIdForCurrentUser(event.current.onesignalId || null);
      });

      // Listener per i token push
      OneSignal.User.pushSubscription.addEventListener('change', (event) => {
        LoggingService.info('OneSignalService', 'Push subscription changed', {
          current: event.current.token
        });
        
        // Salva automaticamente il nuovo token se c'è un utente loggato
        this.savePushTokenForCurrentUser(event.current.token || null);
      });

      LoggingService.info('OneSignalService', 'OneSignal service initialized successfully');
      
      // Imposta il flag che indica che OneSignal è pronto
      this.isOneSignalReady = true;
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error initializing OneSignal service', error);
      this.isOneSignalReady = false;
      throw error;
    }
  }

  /**
   * Ottiene l'ID OneSignal corrente
   */
  static async getOneSignalId(): Promise<string | null> {
    try {
      const onesignalId = await OneSignal.User.getOnesignalId();
      LoggingService.info('OneSignalService', 'Retrieved OneSignal ID', { onesignalId });
      return onesignalId || null;
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error getting OneSignal ID', error);
      return null;
    }
  }

  /**
   * Ottiene il token push corrente
   */
  static async getPushToken(): Promise<string | null> {
    try {
      const pushToken = await OneSignal.User.pushSubscription.getTokenAsync();
      LoggingService.info('OneSignalService', 'Retrieved push token', {
        hasToken: !!pushToken,
        tokenLength: pushToken?.length
      });
      return pushToken || null;
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error getting push token', error);
      return null;
    }
  }

  /**
   * Salva l'ID OneSignal per un utente specifico nel database
   */
  static async saveOneSignalId(userId: string, oneSignalId: string | null): Promise<void> {
    try {
      LoggingService.info('OneSignalService', 'Saving OneSignal ID to database', {
        userId,
        oneSignalId: oneSignalId ? oneSignalId.substring(0, 8) + '...' : null
      });

      const { error } = await supabase
        .from('users')
        .update({
          onesignal_id: oneSignalId,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      LoggingService.info('OneSignalService', 'OneSignal ID saved successfully');
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error saving OneSignal ID', error);
      throw error;
    }
  }

  /**
   * Salva il token push per un utente specifico nel database
   */
  static async savePushToken(userId: string, pushToken: string | null): Promise<void> {
    try {
      LoggingService.info('OneSignalService', 'Saving push token to database', {
        userId,
        hasToken: !!pushToken,
        tokenLength: pushToken?.length
      });

      const { error } = await supabase
        .from('users')
        .update({
          push_token: pushToken,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      LoggingService.info('OneSignalService', 'Push token saved successfully');
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error saving push token', error);
      throw error;
    }
  }

  /**
   * Salva l'ID OneSignal per l'utente correntemente loggato
   */
  static async saveOneSignalIdForCurrentUser(oneSignalId: string | null): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        LoggingService.warning('OneSignalService', 'No current user session, cannot save OneSignal ID');
        return;
      }

      await this.saveOneSignalId(session.user.id, oneSignalId);
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error saving OneSignal ID for current user', error);
    }
  }

  /**
   * Salva il token push per l'utente correntemente loggato
   */
  static async savePushTokenForCurrentUser(pushToken: string | null): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        LoggingService.warning('OneSignalService', 'No current user session, cannot save push token');
        return;
      }

      await this.savePushToken(session.user.id, pushToken);
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error saving push token for current user', error);
    }
  }

  /**
   * Configura OneSignal per un utente specifico
   */
  static async configureForUser(userData: OneSignalUserData): Promise<void> {
    try {
      LoggingService.info('OneSignalService', 'Configuring OneSignal for user', {
        userId: userData.userId,
        email: userData.email,
        hasOneSignalId: !!userData.oneSignalId
      });

      // Verifica che OneSignal sia inizializzato prima di procedere
      await this.waitForOneSignalInitialization();

      // Login dell'utente in OneSignal
      await OneSignal.login(userData.userId);

      // Imposta i tag utente
      const tags: Record<string, string> = {
        user_id: userData.userId,
        email: userData.email || 'no-email@example.com'
      };

      if (userData.firstName && userData.lastName) {
        tags.user_name = `${userData.firstName} ${userData.lastName}`;
        tags.first_name = userData.firstName;
        tags.last_name = userData.lastName;
      }

      await OneSignal.User.addTags(tags);

      // Salva l'ID OneSignal e il token push nel database
      const currentOneSignalId = await this.getOneSignalId();
      const currentPushToken = await this.getPushToken();

      if (currentOneSignalId) {
        await this.saveOneSignalId(userData.userId, currentOneSignalId);
      }

      if (currentPushToken) {
        await this.savePushToken(userData.userId, currentPushToken);
      }

      LoggingService.info('OneSignalService', 'OneSignal configured successfully for user');
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error configuring OneSignal for user', error);
      throw error;
    }
  }

  /**
   * Effettua il logout da OneSignal
   */
  static async logout(): Promise<void> {
    try {
      LoggingService.info('OneSignalService', 'Logging out from OneSignal');
      await OneSignal.logout();
      LoggingService.info('OneSignalService', 'OneSignal logout successful');
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error during OneSignal logout', error);
      throw error;
    }
  }

  /**
   * Recupera i dati OneSignal per un utente dal database
   */
  static async getUserOneSignalData(userId: string): Promise<{ onesignalId: string | null, pushToken: string | null }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('onesignal_id, push_token')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return {
        onesignalId: (data?.onesignal_id as string) || null,
        pushToken: (data?.push_token as string) || null
      };
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error getting user OneSignal data', error);
      return { onesignalId: null, pushToken: null };
    }
  }
}