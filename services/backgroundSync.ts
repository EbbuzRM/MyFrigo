import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { StorageService } from './StorageService';
import { NotificationService } from './NotificationService';

export const BACKGROUND_FETCH_TASK = 'background-notification-sync';

// 1. Definisci il task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const now = new Date();
  console.log(`[BackgroundFetch] Task ${BACKGROUND_FETCH_TASK} eseguito alle: ${now.toISOString()}`);

  try {
    // Questa logica verrà eseguita in background
    console.log('[BackgroundFetch] Recupero impostazioni e prodotti...');
    const settings = await StorageService.getSettings();
    const { data: products } = await StorageService.getProducts();

    if (products && settings) {
      console.log(`[BackgroundFetch] Dati recuperati. Riprogrammo le notifiche per ${products.length} prodotti.`);
      // Cancella le vecchie e riprogramma tutto per assicurarsi che siano aggiornate
      await Notifications.cancelAllScheduledNotificationsAsync();
      await NotificationService.scheduleMultipleNotifications(
        products.filter(p => p.status === 'active'),
        settings
      );
      console.log('[BackgroundFetch] Riprogrammazione completata.');
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    console.log('[BackgroundFetch] Nessun dato da processare.');
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundFetch] Errore durante l_esecuzione del task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// 2. Funzione helper per registrare il task
export async function registerBackgroundFetchAsync() {
  console.log('[BackgroundFetch] Tentativo di registrazione del task...');
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minuti
      stopOnTerminate: false, // false: continua a funzionare anche se l'app è terminata
      startOnBoot: true,      // true: si riattiva al riavvio del dispositivo
    });
    console.log('[BackgroundFetch] Task registrato con successo.');
  } catch (error) {
    console.error('[BackgroundFetch] Errore durante la registrazione del task:', error);
  }
}