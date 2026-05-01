import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { LoggingService } from '../LoggingService';

export interface ExpoUpdatesManifest {
  id: string;
  runtimeVersion: string;
  extra?: {
    version?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface DownloadProgress {
  totalBytes: number;
  totalBytesWritten: number;
}

export interface UpdateInfo {
  isAvailable: boolean;
  isUpdatePending: boolean;
  currentVersion: string;
  availableVersion?: string;
  manifest?: ExpoUpdatesManifest;
  /** True quando l'app è in modalità sviluppo (__DEV__) e gli aggiornamenti OTA non sono disponibili */
  isDevMode?: boolean;
}

export interface UpdateSettings {
  autoCheckEnabled: boolean;
  autoInstallEnabled: boolean;
  checkInterval: number; // in ore
  lastCheckTime?: number;
}

interface ExpoUpdateCheckResult {
  isAvailable: boolean;
  isPending?: boolean;
  manifest?: ExpoUpdatesManifest;
}

export class UpdateMetadataService {
  static async checkAvailability(isUpdatePending: boolean, isChecking: boolean, forceCheck: boolean): Promise<UpdateInfo> {
    if (Platform.OS === 'web' || __DEV__) {
      return {
        isAvailable: false,
        isUpdatePending: false,
        currentVersion: Constants.expoConfig?.version || '1.0.0',
        isDevMode: true,
      };
    }

    if (isUpdatePending) {
      return {
        isAvailable: true,
        isUpdatePending: true,
        currentVersion: Constants.expoConfig?.version || '1.0.0',
      };
    }

    if (isChecking && !forceCheck) {
      LoggingService.info('UpdateService', 'Check aggiornamento già in corso');
      return {
        isAvailable: false,
        isUpdatePending: isUpdatePending,
        currentVersion: Constants.expoConfig?.version || '1.0.0',
      };
    }

    try {
      LoggingService.info('UpdateService', 'Inizio check aggiornamenti...');
      const updateResult = await Updates.checkForUpdateAsync() as ExpoUpdateCheckResult;
      const manifest = updateResult.manifest;

      return {
        isAvailable: updateResult.isAvailable,
        isUpdatePending: isUpdatePending,
        currentVersion: Constants.expoConfig?.version || '1.0.0',
        availableVersion: manifest?.extra?.version || manifest?.runtimeVersion,
        manifest: manifest,
      };
    } catch (error: unknown) {
      LoggingService.error('UpdateService', 'Errore durante il check aggiornamenti:', error);
      return {
        isAvailable: false,
        isUpdatePending: isUpdatePending,
        currentVersion: Constants.expoConfig?.version || '1.0.0',
      };
    }
  }

  static shouldCheckForUpdates(settings: UpdateSettings): boolean {
    if (!settings.autoCheckEnabled || Platform.OS === 'web' || __DEV__) {
      return false;
    }
    const now = Date.now();
    const lastCheck = settings.lastCheckTime || 0;
    const intervalMs = settings.checkInterval * 60 * 60 * 1000;
    return (now - lastCheck) >= intervalMs;
  }

  static getBuildInfo() {
    return {
      updateId: Updates.updateId,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      runtimeVersion: Updates.runtimeVersion,
    };
  }
}
