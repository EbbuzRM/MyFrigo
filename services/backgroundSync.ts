import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { StorageService } from './StorageService';
import { NotificationService } from './NotificationService';
import { LoggingService } from './LoggingService';

export const BACKGROUND_TASK_NAME = 'background-notification-sync';

// 1. Definisci il task usando TaskManager e BackgroundTask
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  const now = new Date();
  LoggingService.info('BackgroundTask', `Task ${BACKGROUND_TASK_NAME} eseguito alle: ${now.toISOString()}`);

  try {
    // Questa logica verrà eseguita in background
    LoggingService.info('BackgroundTask', 'Recupero impostazioni e prodotti...');
    const settings = await StorageService.getSettings();
    const { data: products } = await StorageService.getProducts();

    if (products && settings) {
      LoggingService.info('BackgroundTask', `Dati recuperati. Riprogrammo le notifiche per ${products.length} prodotti.`);
      // Cancella le vecchie e riprogramma tutto per assicurarsi che siano aggiornate
      await Notifications.cancelAllScheduledNotificationsAsync();
      await NotificationService.scheduleMultipleNotifications(
        products.filter(p => p.status === 'active'),
        settings
      );
      LoggingService.info('BackgroundTask', 'Riprogrammazione completata.');
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    LoggingService.info('BackgroundTask', 'Nessun dato da processare.');
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    LoggingService.error('BackgroundTask', `Errore durante l'esecuzione del task: ${error}`);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// 2. Funzione helper per registrare il task
export async function registerBackgroundTaskAsync() {
  LoggingService.info('BackgroundTask', 'Tentativo di registrazione del task...');
  try {
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 15 * 60, // 15 minuti
    });
    LoggingService.info('BackgroundTask', 'Task registrato con successo.');
  } catch (error) {
    LoggingService.error('BackgroundTask', `Errore durante la registrazione del task: ${error}`);
  }
}

// Mantieni compatibilità con il vecchio nome per il codice esistente
export const registerBackgroundFetchAsync = registerBackgroundTaskAsync;
