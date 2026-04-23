import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { LoggingService } from './LoggingService';
import { 
  UpdateMetadataService, 
  UpdateInfo, 
  UpdateSettings, 
  ExpoUpdatesManifest 
} from './update/UpdateService.metadata';
import { UpdateDownloadService, DownloadProgress } from './update/UpdateService.download';
import { UpdateNotificationService, UpdateEventEmitter } from './update/UpdateService.notifications';

export { ExpoUpdatesManifest, UpdateInfo, UpdateSettings, DownloadProgress, UpdateEventEmitter };

export class UpdateService {
  private static isInitialized = false;
  private static isChecking = false;
  private static isDownloading = false;
  private static _isUpdatePending = false;

  private static defaultSettings: UpdateSettings = {
    autoCheckEnabled: true,
    autoInstallEnabled: true,
    checkInterval: 24,
  };

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

    const result = await UpdateMetadataService.checkAvailability(
      this._isUpdatePending, 
      this.isChecking, 
      forceCheck
    );

    if (Platform.OS !== 'web' && !__DEV__) {
      try {
        this.isChecking = true;
        // The metadata service handles the actual API call
        // We just wrap it to maintain state and notify
        const info = await UpdateMetadataService.checkAvailability(
          this._isUpdatePending, 
          this.isChecking, 
          forceCheck
        );
        
        if (info) {
          UpdateNotificationService.notifyUpdateChecked(info);
        }
        return info;
      } catch (error) {
        const errorInfo = {
          isAvailable: false,
          isUpdatePending: this._isUpdatePending,
          currentVersion: (await UpdateMetadataService.checkAvailability(this._isUpdatePending, this.isChecking, forceCheck)).currentVersion,
        };
        UpdateNotificationService.notifyUpdateError(errorInfo);
        return errorInfo;
      } finally {
        this.isChecking = false;
      }
    }
    return result;
  }

  static async downloadUpdate(onProgress?: (progress: DownloadProgress) => void): Promise<boolean> {
    if (!this.isInitialized) await this.initialize();

    const result = await UpdateDownloadService.download(
      this.isInitialized,
      this.isDownloading,
      this._isUpdatePending,
      () => this.checkForUpdate(),
      onProgress
    );

    if (result.success) {
      if (result.isNew) {
        this._isUpdatePending = true;
      }
      if (result.updateInfo) {
        UpdateNotificationService.notifyUpdateDownloaded({
          ...result.updateInfo,
          isUpdatePending: true
        });
      }
      return result.success;
    } else {
      UpdateNotificationService.notifyDownloadError();
      return false;
    }
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

  static async performFullUpdate(
    autoInstall: boolean = false,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<{ success: boolean; message: string }> {
    try {
      LoggingService.info('UpdateService', 'Inizio flusso completo di aggiornamento...');
      const updateInfo = await this.checkForUpdate();

      if (!updateInfo.isAvailable) {
        return { success: true, message: 'L\'app è aggiornata all\'ultima versione' };
      }

      const downloadSuccess = await this.downloadUpdate(onProgress);
      if (!downloadSuccess) {
        return { success: false, message: 'Errore durante il download dell\'aggiornamento' };
      }

      if (autoInstall) {
        await this.restartApp();
        return { success: true, message: 'Aggiornamento installato con successo' };
      } else {
        return { success: true, message: 'Aggiornamento scaricato. Riavvia l\'app per applicarlo.' };
      }
    } catch (error: unknown) {
      LoggingService.error('UpdateService', 'Errore durante il flusso di aggiornamento:', error);
      return { success: false, message: 'Errore durante l\'aggiornamento' };
    }
  }

  static shouldCheckForUpdates(settings: UpdateSettings): boolean {
    return UpdateMetadataService.shouldCheckForUpdates(settings);
  }

  static async performAutoCheck(settings: UpdateSettings): Promise<UpdateInfo | null> {
    if (!this.shouldCheckForUpdates(settings)) return null;

    try {
      LoggingService.info('UpdateService', 'Esecuzione check automatico aggiornamenti...');
      const updateInfo = await this.checkForUpdate();

      if (updateInfo.isAvailable && settings.autoInstallEnabled) {
        await this.downloadUpdate();
        await this.restartApp();
      }
      return updateInfo;
    } catch (error: unknown) {
      LoggingService.error('UpdateService', 'Errore durante il check automatico:', error);
      return null;
    }
  }

  static getDefaultSettings(): UpdateSettings {
    return { ...this.defaultSettings };
  }

  static isReady(): boolean {
    return this.isInitialized;
  }

  static isCheckingForUpdates(): boolean {
    return this.isChecking;
  }

  static isDownloadingUpdate(): boolean {
    return this.isDownloading;
  }

  static getCurrentBuildInfo() {
    return UpdateMetadataService.getBuildInfo();
  }

  static resetState(): void {
    this.isInitialized = false;
    this.isChecking = false;
    this.isDownloading = false;
    this._isUpdatePending = false;
  }
}
