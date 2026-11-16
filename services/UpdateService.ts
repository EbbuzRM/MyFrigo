// UpdateService.ts — UpdateService module.
//
// exports: ExpoUpdatesManifest | UpdateInfo | UpdateSettings | DownloadProgress | UpdateEventEmitter | UpdateService
// used_by: components\GlobalUpdateModal.tsx
//                   components\UpdateModal.tsx
//                   components\UpdateStatusMessage.tsx
//                   context\UpdateContext.tsx
//                   context\__tests__\UpdateContext.test.tsx
// rules:   - Module must maintain the singleton-static pattern for UpdateService; all methods and state are static, and instance creation is not supported.
//          - External file dependencies are strictly structured into three files under `./update/`: `UpdateService.metadata`, `UpdateService.download`, and `UpdateService.notifications`; any new update-related logic must be placed in the appropriate submodule.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { LoggingService } from './LoggingService';
import { 
  UpdateMetadataService, 
  UpdateInfo, 
  UpdateSettings, 
  ExpoUpdatesManifest,
  DownloadProgress 
} from './update/UpdateService.metadata';
import { UpdateDownloadService } from './update/UpdateService.download';
import { UpdateNotificationService, UpdateEventEmitter } from './update/UpdateService.notifications';


export type { ExpoUpdatesManifest, UpdateInfo, UpdateSettings, DownloadProgress };
export { UpdateEventEmitter };

export class UpdateService {
  private static isInitialized = false;
  private static isChecking = false;
  private static isDownloading = false;
  private static _isUpdatePending = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized || Platform.OS === 'web') {
      return;
    }

    try {
      if (!Updates || typeof Updates.checkForUpdateAsync !== 'function') {
        LoggingService.error('UpdateService', 'expo-updates non è disponibile o non correttamente linkato');
        return;
      }

      if (__DEV__) {
        LoggingService.info('UpdateService', 'Modalità sviluppo rilevata, aggiornamenti OTA disabilitati');
        this.isInitialized = true;
        return;
      }

      LoggingService.info('UpdateService', `Stato aggiornamento: updateId=${Updates.updateId}, isEmbedded=${Updates.isEmbeddedLaunch}`);
      this.isInitialized = true;
      LoggingService.info('UpdateService', 'UpdateService inizializzato con successo');
    } catch (error: unknown) {
      LoggingService.error('UpdateService', 'Errore durante l\'inizializzazione:', error);
    }
  }

  static async checkForUpdate(forceCheck: boolean = false): Promise<UpdateInfo> {
    if (!this.isInitialized) await this.initialize();

    if (Platform.OS !== 'web' && !__DEV__) {
      // Cattura lo stato PRIMA di impostarlo: passare il flag già a true farebbe
      // restituire sempre "nessun aggiornamento" a checkAvailability.
      const wasChecking = this.isChecking;
      try {
        this.isChecking = true;
        // The metadata service handles the actual API call
        // We just wrap it to maintain state and notify
        const info = await UpdateMetadataService.checkAvailability(
          this._isUpdatePending,
          wasChecking,
          forceCheck
        );
        
        if (info) {
          UpdateNotificationService.notifyUpdateChecked(info);
        }
        return info;
      } catch (error) {
        LoggingService.error('UpdateService', 'Errore durante checkForUpdate:', error);
        const errorInfo = {
          isAvailable: false,
          isUpdatePending: this._isUpdatePending,
          currentVersion: 'unknown', // Non possiamo saperlo se il check è fallito
        };
        UpdateNotificationService.notifyUpdateError(errorInfo);
        return errorInfo;
      } finally {
        if (!wasChecking) this.isChecking = false;
      }
    } else {
      // Web o DEV mode: chiama checkAvailability senza gestire stato/notifiche
      return await UpdateMetadataService.checkAvailability(
        this._isUpdatePending, 
        this.isChecking, 
        forceCheck
      );
    }
  }

  static async downloadUpdate(onProgress?: (progress: DownloadProgress) => void): Promise<boolean> {
    if (!this.isInitialized) await this.initialize();

    // Il flag isDownloading non veniva mai impostato: il guard anti-doppio-download era inerte.
    const wasDownloading = this.isDownloading;
    this.isDownloading = true;
    let result: Awaited<ReturnType<typeof UpdateDownloadService.download>>;
    try {
      result = await UpdateDownloadService.download(
        this.isInitialized,
        wasDownloading,
        this._isUpdatePending,
        () => this.checkForUpdate(),
        onProgress
      );
    } finally {
      if (!wasDownloading) this.isDownloading = false;
    }

    if (result.success) {
      // fetchUpdateAsync riuscito dopo un check positivo = update pronto da applicare
      // (isNew è false anche quando era già stato scaricato, es. da useUpdates).
      this._isUpdatePending = true;
      if (result.updateInfo) {
        UpdateNotificationService.notifyUpdateDownloaded({
          ...result.updateInfo,
          isUpdatePending: true
        });
      }
      return result.success;
    } else {
      if (!wasDownloading) UpdateNotificationService.notifyDownloadError();
      return false;
    }
  }

  /**
   * Segnala che un update è già stato scaricato da un altro canale (hook useUpdates),
   * così restartApp/downloadUpdate non lo ricercano né lo ignorano.
   */
  static markUpdatePending(): void {
    this._isUpdatePending = true;
  }

  static async restartApp(): Promise<void> {
    if (!this.isInitialized) await this.initialize();

    if (Platform.OS === 'web' || __DEV__) {
      LoggingService.info('UpdateService', 'Riavvio non supportato in modalità sviluppo/web');
      return;
    }

    try {
      if (!this._isUpdatePending) {
        const updateInfo = await this.checkForUpdate();
        if (!updateInfo.isUpdatePending) {
          LoggingService.warning('UpdateService', 'Nessun aggiornamento in attesa da applicare');
          return;
        }
      }

      UpdateNotificationService.notifyAppRestarting();
      await new Promise(resolve => setTimeout(resolve, 500));
      await UpdateDownloadService.reload();
    } catch (error: unknown) {
      LoggingService.error('UpdateService', 'Errore durante il riavvio:', error);
      UpdateNotificationService.notifyRestartError();
    }
  }

  static isReady(): boolean {
    return this.isInitialized;
  }

  static isCheckingForUpdates(): boolean {
    return this.isChecking;
  }

  static resetState(): void {
    this.isInitialized = false;
    this.isChecking = false;
    this.isDownloading = false;
    this._isUpdatePending = false;
  }
}
