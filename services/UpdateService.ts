import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { LoggingService } from './LoggingService';

/**
 * Interfaccia per il manifest di expo-updates
 */
export interface ExpoUpdatesManifest {
  id: string;
  runtimeVersion: string;
  extra?: {
    version?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Interfaccia per il risultato di Updates.checkForUpdateAsync()
 */
interface ExpoUpdateCheckResult {
  isAvailable: boolean;
  isPending?: boolean;
  manifest?: ExpoUpdatesManifest;
}

/**
 * Interfaccia per il risultato del check di aggiornamento (interno)
 */
interface UpdateCheckResult {
  isAvailable: boolean;
  isPending: boolean;
  availableVersion?: string;
  manifest?: ExpoUpdatesManifest;
}

/**
 * Interfaccia per le informazioni di aggiornamento
 */
export interface UpdateInfo {
  isAvailable: boolean;
  isUpdatePending: boolean;
  currentVersion: string;
  availableVersion?: string;
  manifest?: ExpoUpdatesManifest;
}

/**
 * Interfaccia per il progresso del download
 */
export interface DownloadProgress {
  totalBytes: number;
  totalBytesWritten: number;
}

/**
 * Interfaccia per le impostazioni di aggiornamento
 */
export interface UpdateSettings {
  autoCheckEnabled: boolean;
  autoInstallEnabled: boolean;
  checkInterval: number; // in ore
  lastCheckTime?: number;
}

/**
 * Event emitter per gli aggiornamenti
 */
type UpdateEventListener = (data: UpdateInfo | null) => void;
const updateListeners: { [key: string]: UpdateEventListener[] } = {};

export const UpdateEventEmitter = {
  on(event: string, listener: UpdateEventListener) {
    if (!updateListeners[event]) {
      updateListeners[event] = [];
    }
    updateListeners[event].push(listener);
    return () => {
      updateListeners[event] = updateListeners[event].filter(l => l !== listener);
    };
  },

  emit(event: string, data?: UpdateInfo | null) {
    if (updateListeners[event]) {
      updateListeners[event].forEach(listener => listener(data || null));
    }
  },

  removeAllListeners(event: string) {
    if (updateListeners[event]) {
      updateListeners[event] = [];
      return true;
    }
    return false;
  }
};

/**
 * Servizio per la gestione degli aggiornamenti OTA
 */
export class UpdateService {
  private static isInitialized = false;
  private static isChecking = false;
  private static isDownloading = false;
  // Traccia internamente se c'è un aggiornamento scaricato e in attesa
  private static _isUpdatePending = false;

  private static defaultSettings: UpdateSettings = {
    autoCheckEnabled: true,
    autoInstallEnabled: true,
    checkInterval: 24, // 24 ore
  };

  /**
   * Inizializza il servizio di aggiornamento
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized || Platform.OS === 'web') {
      return;
    }

    try {
      // Verifica che expo-updates sia disponibile
      if (!Updates || typeof Updates.checkForUpdateAsync !== 'function') {
        LoggingService.error('UpdateService', 'expo-updates non è disponibile o non correttamente linkato');
        return;
      }

      // Controlla se siamo in un ambiente di sviluppo
      if (__DEV__) {
        LoggingService.info('UpdateService', 'Modalità sviluppo rilevata, aggiornamenti OTA disabilitati');
        this.isInitialized = true;
        return;
      }

      // Controlla se l'app è stata installata tramite EAS Update
      const updateId = Updates.updateId;
      const isEmbedded = Updates.isEmbeddedLaunch;

      LoggingService.info('UpdateService', `Stato aggiornamento: updateId=${updateId}, isEmbedded=${isEmbedded}`);

      this.isInitialized = true;
      LoggingService.info('UpdateService', 'UpdateService inizializzato con successo');

    } catch (error: unknown) {
      LoggingService.error('UpdateService', 'Errore durante l\'inizializzazione:', error);
    }
  }

  /**
   * Verifica se ci sono aggiornamenti disponibili
   * @param forceCheck Forza il check anche se è già in corso
   * @returns Promise con le informazioni sull'aggiornamento
   */
  static async checkForUpdate(forceCheck: boolean = false): Promise<UpdateInfo> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (Platform.OS === 'web' || __DEV__) {
      return {
        isAvailable: false,
        isUpdatePending: false,
        currentVersion: Constants.expoConfig?.version || '1.0.0',
      };
    }

    // Se abbiamo già scaricato un aggiornamento, restituiamo quello stato
    // Questo evita di fare un altro check di rete inutile e potenzialmente fuorviante
    if (this._isUpdatePending) {
      return {
        isAvailable: true,
        isUpdatePending: true,
        currentVersion: Constants.expoConfig?.version || '1.0.0',
        // Non abbiamo il manifesto a portata di mano qui facilmente senza check, 
        // ma sappiamo che è pending.
      };
    }

    if (this.isChecking && !forceCheck) {
      LoggingService.info('UpdateService', 'Check aggiornamento già in corso');
      return {
        isAvailable: false,
        isUpdatePending: this._isUpdatePending,
        currentVersion: Constants.expoConfig?.version || '1.0.0',
      };
    }

    try {
      this.isChecking = true;
      LoggingService.info('UpdateService', 'Inizio check aggiornamenti...');

      const updateResult = await Updates.checkForUpdateAsync() as ExpoUpdateCheckResult;
      const manifest = updateResult.manifest;

      const updateInfo: UpdateInfo = {
        isAvailable: updateResult.isAvailable,
        isUpdatePending: this._isUpdatePending,
        currentVersion: Constants.expoConfig?.version || '1.0.0',
        availableVersion: manifest?.extra?.version || manifest?.runtimeVersion,
        manifest: manifest,
      };

      LoggingService.info('UpdateService', `Risultato check: disponibile=${updateInfo.isAvailable}, pending=${updateInfo.isUpdatePending}`);

      // Emetti evento per notificare l'UI
      if (updateInfo) {
        UpdateEventEmitter.emit('updateChecked', updateInfo);
      }

      return updateInfo;

    } catch (error: unknown) {
      LoggingService.error('UpdateService', 'Errore durante il check aggiornamenti:', error);

      const errorInfo: UpdateInfo = {
        isAvailable: false,
        isUpdatePending: this._isUpdatePending,
        currentVersion: Constants.expoConfig?.version || '1.0.0',
      };

      UpdateEventEmitter.emit('updateError', errorInfo);
      return errorInfo;

    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Scarica un aggiornamento disponibile
   * @param onProgress Callback per il progresso del download
   * @returns Promise con il risultato del download
   */
  static async downloadUpdate(onProgress?: (progress: DownloadProgress) => void): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (Platform.OS === 'web' || __DEV__) {
      LoggingService.info('UpdateService', 'Download non supportato in modalità sviluppo/web');
      return false;
    }

    if (this.isDownloading) {
      LoggingService.info('UpdateService', 'Download già in corso');
      return false;
    }

    try {
      this.isDownloading = true;
      LoggingService.info('UpdateService', 'Inizio download aggiornamento...');

      // Prima verifica che ci sia un aggiornamento disponibile
      const updateInfo = await this.checkForUpdate();
      // Se è già pending, consideriamolo un successo (è già scaricato)
      if (this._isUpdatePending) {
        LoggingService.info('UpdateService', 'Aggiornamento già scaricato e in attesa di installazione');
        return true;
      }

      if (!updateInfo.isAvailable) {
        LoggingService.info('UpdateService', 'Nessun aggiornamento disponibile da scaricare');
        return false;
      }

      // Il progresso reale del download non è disponibile
      if (onProgress) {
        onProgress({
          totalBytes: 0,
          totalBytesWritten: 0,
        });
      }

      // Scarica l'aggiornamento
      const downloadResult = await Updates.fetchUpdateAsync();

      LoggingService.info('UpdateService', `Download completato: isNew=${downloadResult.isNew}`);

      if (downloadResult.isNew) {
        this._isUpdatePending = true; // Segna come pending!
      }

      // Emetti evento per notificare l'UI -> Passiamo isUpdatePending a true
      UpdateEventEmitter.emit('updateDownloaded', {
        ...updateInfo,
        isUpdatePending: true
      });

      return downloadResult.isNew;

    } catch (error: unknown) {
      LoggingService.error('UpdateService', 'Errore durante il download:', error);
      UpdateEventEmitter.emit('downloadError', null);
      return false;

    } finally {
      this.isDownloading = false;
    }
  }

  /**
   * Riavvia l'app per applicare un aggiornamento scaricato
   * @returns Promise che si risolve quando il riavvio è stato richiesto
   */
  static async restartApp(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (Platform.OS === 'web' || __DEV__) {
      LoggingService.info('UpdateService', 'Riavvio non supportato in modalità sviluppo/web');
      return;
    }

    try {
      LoggingService.info('UpdateService', 'Richiesta riavvio per applicare aggiornamento...');

      // Controllo esplicito sullo flag interno prima, per evitare check di rete
      if (!this._isUpdatePending) {
        // Fallback al check classico se per qualche motivo il flag non è settato
        const updateInfo = await this.checkForUpdate();

        // Se non c'è un aggiornamento PENDING (cioè scaricato), non riavviare
        if (!updateInfo.isUpdatePending) {
          LoggingService.warning('UpdateService', 'Nessun aggiornamento in attesa da applicare');
          return;
        }
      }

      // Emetti evento per notificare l'UI che stiamo per riavviare
      UpdateEventEmitter.emit('appRestarting', null);

      // Attendi un momento per permettere all'UI di mostrare il messaggio
      await new Promise(resolve => setTimeout(resolve, 500));

      // Riavvia l'app
      await Updates.reloadAsync();

    } catch (error: unknown) {
      LoggingService.error('UpdateService', 'Errore durante il riavvio:', error);
      UpdateEventEmitter.emit('restartError', null);
    }
  }

  /**
   * Esegue il flusso completo di aggiornamento (check + download + riavvio)
   * @param autoInstall Se true, installa automaticamente l'aggiornamento
   * @param onProgress Callback per il progresso del download
   * @returns Promise con il risultato dell'operazione
   */
  static async performFullUpdate(
    autoInstall: boolean = false,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<{ success: boolean; message: string }> {
    try {
      LoggingService.info('UpdateService', 'Inizio flusso completo di aggiornamento...');

      // 1. Check aggiornamenti
      const updateInfo = await this.checkForUpdate();

      if (!updateInfo.isAvailable) {
        return {
          success: true,
          message: 'L\'app è aggiornata all\'ultima versione'
        };
      }

      LoggingService.info('UpdateService', `Aggiornamento disponibile: ${updateInfo.availableVersion}`);

      // 2. Download aggiornamento
      const downloadSuccess = await this.downloadUpdate(onProgress);

      if (!downloadSuccess) {
        return {
          success: false,
          message: 'Errore durante il download dell\'aggiornamento'
        };
      }

      LoggingService.info('UpdateService', 'Download completato con successo');

      // 3. Installazione (riavvio)
      if (autoInstall) {
        await this.restartApp();
        return {
          success: true,
          message: 'Aggiornamento installato con successo'
        };
      } else {
        return {
          success: true,
          message: 'Aggiornamento scaricato. Riavvia l\'app per applicarlo.'
        };
      }

    } catch (error: unknown) {
      LoggingService.error('UpdateService', 'Errore durante il flusso di aggiornamento:', error);
      return {
        success: false,
        message: 'Errore durante l\'aggiornamento'
      };
    }
  }

  /**
   * Verifica se è ora di fare un check automatico
   * @param settings Impostazioni di aggiornamento
   * @returns true se è ora di fare un check
   */
  static shouldCheckForUpdates(settings: UpdateSettings): boolean {
    if (!settings.autoCheckEnabled || Platform.OS === 'web' || __DEV__) {
      return false;
    }

    const now = Date.now();
    const lastCheck = settings.lastCheckTime || 0;
    const intervalMs = settings.checkInterval * 60 * 60 * 1000; // Converti ore in millisecondi

    return (now - lastCheck) >= intervalMs;
  }

  /**
   * Esegue un check automatico se è il momento giusto
   * @param settings Impostazioni di aggiornamento
   * @returns Promise con le informazioni sull'aggiornamento
   */
  static async performAutoCheck(settings: UpdateSettings): Promise<UpdateInfo | null> {
    if (!this.shouldCheckForUpdates(settings)) {
      return null;
    }

    try {
      LoggingService.info('UpdateService', 'Esecuzione check automatico aggiornamenti...');

      const updateInfo = await this.checkForUpdate();

      // Aggiorna il timestamp dell'ultimo check (clonato per evitare race condition)
      const updatedSettings = { ...settings, lastCheckTime: Date.now() };

      // Se c'è un aggiornamento e l'auto-install è abilitata, scaricalo e riavvia
      if (updateInfo.isAvailable && settings.autoInstallEnabled) {
        LoggingService.info('UpdateService', 'Aggiornamento disponibile, inizio download automatico + riavvio...');
        await this.downloadUpdate();
        await this.restartApp();
      }

      return updateInfo;

    } catch (error: unknown) {
      LoggingService.error('UpdateService', 'Errore durante il check automatico:', error);
      return null;
    }
  }

  /**
   * Ottiene le impostazioni di aggiornamento di default
   * @returns Impostazioni di default
   */
  static getDefaultSettings(): UpdateSettings {
    return { ...this.defaultSettings };
  }

  /**
   * Verifica se il servizio è inizializzato
   * @returns true se il servizio è inizializzato
   */
  static isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Verifica se un check è in corso
   * @returns true se un check è in corso
   */
  static isCheckingForUpdates(): boolean {
    return this.isChecking;
  }

  /**
   * Verifica se un download è in corso
   * @returns true se un download è in corso
   */
  static isDownloadingUpdate(): boolean {
    return this.isDownloading;
  }

  /**
   * Ottiene informazioni sulla build corrente
   * @returns Informazioni sulla build
   */
  static getCurrentBuildInfo(): {
    updateId: string | null;
    isEmbeddedLaunch: boolean;
    runtimeVersion: string | null;
  } {
    return {
      updateId: Updates.updateId,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      runtimeVersion: Updates.runtimeVersion,
    };
  }

  /**
   * Resetta lo stato interno del servizio (utile per i test)
   */
  static resetState(): void {
    this.isInitialized = false;
    this.isChecking = false;
    this.isDownloading = false;
    this._isUpdatePending = false;
  }
}