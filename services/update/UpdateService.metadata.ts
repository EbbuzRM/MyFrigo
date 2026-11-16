// UpdateService.metadata.ts — UpdateService.metadata module.
//
// exports: ExpoUpdatesManifest | DownloadProgress | UpdateInfo | UpdateSettings | getManifestVersion | UpdateMetadataService
// used_by: services\UpdateService.ts
//                   services\update\UpdateService.download.ts
//                   services\update\UpdateService.notifications.ts
// rules:   Return only the constraint text.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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
}

interface ExpoUpdateCheckResult {
  isAvailable: boolean;
  isPending?: boolean;
  manifest?: ExpoUpdatesManifest;
}

/**
 * Versione app dentro un manifest EAS Update. La config Expo sta in `extra.expoClient`;
 * NON si ripiega su runtimeVersion (coincide con la versione installata → "nuova versione" falsa).
 */
export function getManifestVersion(manifest?: { extra?: Record<string, unknown> } | null): string | undefined {
  const extra = manifest?.extra;
  const expoClient = extra?.expoClient as { version?: unknown } | undefined;
  if (typeof expoClient?.version === 'string') return expoClient.version;
  if (typeof extra?.version === 'string') return extra.version;
  return undefined;
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
      LoggingService.info('UpdateService', `[DEBUG] Runtime Version: ${Updates.runtimeVersion}`);
      LoggingService.info('UpdateService', `[DEBUG] Update ID: ${Updates.updateId}`);
      LoggingService.info('UpdateService', 'Inizio check aggiornamenti...');
      const updateResult = await Updates.checkForUpdateAsync() as ExpoUpdateCheckResult;
      LoggingService.info('UpdateService', `[DEBUG] checkForUpdateAsync result: ${JSON.stringify(updateResult)}`);
      const manifest = updateResult.manifest;


      return {
        isAvailable: updateResult.isAvailable,
        isUpdatePending: isUpdatePending,
        currentVersion: Constants.expoConfig?.version || '1.0.0',
        availableVersion: getManifestVersion(manifest),
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
}
