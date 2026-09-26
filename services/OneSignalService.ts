// OneSignalService.ts — OneSignalService module.
//
// exports: OneSignalUserData | OneSignalService
// used_by: context\AuthContext.tsx
//                   context\__tests__\AuthContext.test.tsx
//                   services\NotificationService.ts
// rules:   - State access in OneSignal event listeners must always include a session check from `supabase.auth.getSession()` before using any user data
//          - All OneSignal operations must go through this service class; direct OneSignal SDK calls elsewhere in the codebase are prohibited
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { OneSignal, type NotificationWillDisplayEvent, type NotificationClickEvent } from 'react-native-onesignal';
import Constants from 'expo-constants';
import { supabase } from './supabaseClient';
import { LoggingService } from './LoggingService';
import { UserDeviceService } from './UserDeviceService';
import { UserNotificationSettingsService } from './UserNotificationSettingsService';
import { UserPushSubscriptionService } from './UserPushSubscriptionService';
import { getSystemLanguage } from '@/i18n/language';
import type { SupportedLanguage } from '@/i18n/types';
import { AppState } from 'react-native';

export interface OneSignalUserData {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

// Heterogeneous fire-and-forget SDK calls; the queue never inspects the result.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OneSignalOp = () => Promise<any>;

export class OneSignalService {
  private static currentUserId: string | null = null;
  private static desiredUserId: string | null = null;
  private static lastLoggedOutUserId: string | null = null;
  private static lastSyncedSubscription: { userId: string; subscriptionId: string; language: SupportedLanguage } | null = null;
  private static accountOperation: Promise<void> = Promise.resolve();
  private static initializationPromise: Promise<void> | null = null;
  private static opQueue: OneSignalOp[] = [];

  private static serializeAccountOperation(operation: () => Promise<void>): Promise<void> {
    const pending = this.accountOperation.then(operation, operation);
    this.accountOperation = pending.catch(() => undefined);
    return pending;
  }

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

        // Foreground notification handler — display notification even when app is in foreground
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: NotificationWillDisplayEvent) => {
          LoggingService.info('OneSignalService', 'Notification received in foreground', {
            notificationId: event.getNotification().notificationId,
          });
          event.getNotification().display();
        });

        // Click notification handler — log when user taps a notification
        OneSignal.Notifications.addEventListener('click', (event: NotificationClickEvent) => {
          LoggingService.info('OneSignalService', 'Notification clicked', {
            notificationId: event.notification.notificationId,
            url: event.result?.url,
          });
        });

        // Configura il listener per il cambiamento dell'ID utente
        OneSignal.User.addEventListener('change', async (event) => {
          try {
            await this.serializeAccountOperation(async () => {
              const onesignalId = event.current.onesignalId;
              if (!onesignalId) return;
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.user && this.currentUserId === session.user.id &&
                  this.desiredUserId === session.user.id &&
                  await OneSignal.User.getOnesignalId() === onesignalId) {
                await UserDeviceService.addDevice(session.user.id, onesignalId);
              }
            });
          } catch (error) {
            LoggingService.error('OneSignalService', 'Error in OneSignal user change listener', error);
          }
        });

        OneSignal.User.pushSubscription.addEventListener('change', async (event) => {
          try {
            await this.serializeAccountOperation(async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.user || this.currentUserId !== session.user.id ||
                  this.desiredUserId !== session.user.id ||
                  await OneSignal.User.pushSubscription.getIdAsync() !== event.current.id) return;
              if (event.previous.id && event.previous.id !== event.current.id) {
                await UserPushSubscriptionService.remove(session.user.id, event.previous.id);
              }
          if (event.current.id) {
            const language = getSystemLanguage();
            await UserPushSubscriptionService.sync(session.user.id, event.current.id, language);
            this.lastSyncedSubscription = { userId: session.user.id, subscriptionId: event.current.id, language };
          }
            });
          } catch (error) {
            LoggingService.error('OneSignalService', 'Failed to sync changed push subscription', error);
          }
        });

        AppState.addEventListener('change', (state) => {
          if (state === 'active') {
            void this.syncPushSubscription().catch(error =>
              LoggingService.error('OneSignalService', 'Failed to sync push subscription on foreground', error)
            );
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
  static async syncPushSubscription(): Promise<void> {
    return this.serializeAccountOperation(() => this.syncPushSubscriptionNow());
  }

  private static async syncPushSubscriptionNow(expectedUserId?: string): Promise<void> {
    const userId = expectedUserId ?? (await supabase.auth.getSession()).data.session?.user.id;
    if (!userId || this.currentUserId !== userId || this.desiredUserId !== userId) return;
    const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();
    if (subscriptionId && this.currentUserId === userId && this.desiredUserId === userId) {
      const language = getSystemLanguage();
      const previous = this.lastSyncedSubscription;
      if (previous?.userId === userId && previous.subscriptionId === subscriptionId && previous.language === language) return;
      await UserPushSubscriptionService.sync(userId, subscriptionId, language);
      this.lastSyncedSubscription = { userId, subscriptionId, language };
    }
  }

  static async configureForUser(userData: OneSignalUserData): Promise<void> {
    this.desiredUserId = userData.userId;
    return this.serializeAccountOperation(async () => {
     try {
      if (this.desiredUserId !== userData.userId) {
        LoggingService.warning('OneSignalService', 'Skipping stale account configuration', { userId: userData.userId });
        return;
      }
      LoggingService.info('OneSignalService', 'Configuring OneSignal for user', { userId: userData.userId });

      await this.execute(async () => {
        // Login OneSignal con l'external user ID (UUID Supabase)
        await OneSignal.login(userData.userId);
        this.currentUserId = userData.userId;
        this.lastLoggedOutUserId = null;
        LoggingService.info('OneSignalService', 'OneSignal.login() completed');

        if (this.desiredUserId !== userData.userId) {
          this.currentUserId = null;
          await OneSignal.logout();
          LoggingService.warning('OneSignalService', 'Discarded stale OneSignal login', { userId: userData.userId });
          return;
        }

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

        await this.syncPushSubscriptionNow(userData.userId);

        // Garantisce che user_notification_settings esista per questo utente
        await UserNotificationSettingsService.ensureSettings(userData.userId);
        LoggingService.info('OneSignalService', 'user_notification_settings ensured');
      });

      LoggingService.info('OneSignalService', 'OneSignal configured successfully for user');
    } catch (error) {
      LoggingService.error('OneSignalService', 'Error configuring OneSignal for user', error);
      throw error;
    }
    });
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
  static async logout(expectedUserId?: string): Promise<void> {
    if (!expectedUserId || this.desiredUserId === expectedUserId) this.desiredUserId = null;
    return this.serializeAccountOperation(async () => {
      LoggingService.info('OneSignalService', 'Starting OneSignal logout');
      if (expectedUserId && this.currentUserId && this.currentUserId !== expectedUserId) {
        LoggingService.info('OneSignalService', 'Ignoring logout for a previous account', { expectedUserId });
        return;
      }
      if (expectedUserId && !this.currentUserId && this.lastLoggedOutUserId === expectedUserId) {
        LoggingService.info('OneSignalService', 'Account already disconnected from OneSignal', { expectedUserId });
        return;
      }

      const failures: unknown[] = [];
      const attempt = async (label: string, operation: () => Promise<void>) => {
        try {
          await operation();
        } catch (error) {
          failures.push(error);
          LoggingService.error('OneSignalService', label, error);
        }
      };

      await attempt('Failed to initialize OneSignal during logout', () => this.initialize());
      let sessionUserId: string | undefined;
      await attempt('Failed to read session during OneSignal logout', async () => {
        const { data: { session } } = await supabase.auth.getSession();
        sessionUserId = session?.user.id;
      });
      const userId = this.currentUserId ?? expectedUserId ?? sessionUserId;
      let onesignalId: string | null | undefined;
      await attempt('Failed to read OneSignal user ID during logout', async () => {
        onesignalId = await OneSignal.User.getOnesignalId();
      });
      if (userId && onesignalId) {
        const deviceId = onesignalId;
        await attempt('Failed to remove device during logout', () => UserDeviceService.removeDevice(userId, deviceId));
      }
      let subscriptionId: string | null | undefined;
      await attempt('Failed to read push subscription during logout', async () => {
        subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();
      });
      if (userId && subscriptionId) {
        const pushSubscriptionId = subscriptionId;
        await attempt('Failed to remove push subscription during logout',
          () => UserPushSubscriptionService.remove(userId, pushSubscriptionId));
      }
      this.currentUserId = null;
      this.lastSyncedSubscription = null;
      let sdkLoggedOut = false;
      await attempt('Failed to disconnect OneSignal SDK during logout', async () => {
        await OneSignal.logout();
        sdkLoggedOut = true;
      });
      if (sdkLoggedOut && failures.length === 0) this.lastLoggedOutUserId = userId ?? null;
      if (failures.length > 0) throw failures[0];
      LoggingService.info('OneSignalService', 'OneSignal logout successful');
    });
  }
}
