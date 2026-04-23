import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import { LoggingService } from '../LoggingService';
import { DownloadProgress, UpdateInfo } from './UpdateService.metadata';

export class UpdateDownloadService {
  static async download(
    isInitialized: boolean,
    isDownloading: boolean,
    isUpdatePending: boolean,
    checkForUpdateFn: () => Promise<UpdateInfo>,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<{ success: boolean; isNew: boolean; updateInfo: UpdateInfo | null }> {
    if (Platform.OS === 'web' || __DEV__) {
      LoggingService.info('UpdateService', 'Download non supportato in modalità sviluppo/web');
      return { success: false, isNew: false, updateInfo: null };
    }

    if (isDownloading) {
      LoggingService.info('UpdateService', 'Download già in corso');
      return { success: false, isNew: false, updateInfo: null };
    }

    try {
      LoggingService.info('UpdateService', 'Inizio download aggiornamento...');
      
      const updateInfo = await checkForUpdateFn();
      
      if (isUpdatePending) {
        LoggingService.info('UpdateService', 'Aggiornamento già scaricato e in attesa di installazione');
        return { success: true, isNew: false, updateInfo };
      }

      if (!updateInfo.isAvailable) {
        LoggingService.info('UpdateService', 'Nessun aggiornamento disponibile da scaricare');
        return { success: false, isNew: false, updateInfo };
      }

      if (onProgress) {
        onProgress({ totalBytes: 0, totalBytesWritten: 0 });
      }

      const downloadResult = await Updates.fetchUpdateAsync();
      LoggingService.info('UpdateService', `Download completato: isNew=${downloadResult.isNew}`);

      return { 
        success: true, 
        isNew: downloadResult.isNew, 
        updateInfo 
      };
    } catch (error: unknown) {
      LoggingService.error('UpdateService', 'Errore durante il download:', error);
      return { success: false, isNew: false, updateInfo: null };
    }
  }

  static async reload(): Promise<void> {
    if (Platform.OS === 'web' || __DEV__) {
      LoggingService.info('UpdateService', 'Riavvio non supportato in modalità sviluppo/web');
      return;
    }
    await Updates.reloadAsync();
  }
}
