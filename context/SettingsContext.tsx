// SettingsContext.tsx — SettingsContext module.
//
// exports: SettingsProvider | useSettings
// used_by: app\(tabs)\index.tsx
//                   app\(tabs)\products.tsx
//                   app\(tabs)\settings.tsx
//                   app\__tests__\settings.test.tsx
//                   components\AppProviders.tsx
//                   hooks\useDiagnosticTests.ts
//                   hooks\useExpirationStatus.ts
//                   hooks\useSettingsSections.ts
// rules:   - All settings mutations must flow through `updateSettings` to ensure persistence via `SettingsService` and React state synchronization; direct `settings` state manipulation is prohibited.
//          - The `permissionStatus` state is a reactive dependency for notification UI; any permission-modifying code must invoke `refreshPermissions()` to keep context in sync.
//          - The context depends on `useAuth` for user identity; authentication changes must trigger SettingsProvider re-mount or state reset.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { convertSettingsToCamelCase } from '../utils/caseConverter';
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { SettingsService, AppSettings } from '@/services/SettingsService';
import { useAuth } from './AuthContext';
import { eventEmitter } from '@/services/NotificationService';
import { NotificationService } from '@/services/NotificationService'; // Importa il servizio
import { OneSignal } from 'react-native-onesignal';
import { LoggingService } from '@/services/LoggingService';

type PermissionStatus = boolean;

interface SettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  permissionStatus: PermissionStatus | null; // Nuovo stato
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  refreshPermissions: () => Promise<void>; // Funzione per aggiornare i permessi
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<boolean | null>(null);

  const checkAndRequestPermissions = useCallback(async () => {
    LoggingService.info('SettingsContext', 'Checking notification permissions...');
    const hasPermission = await OneSignal.Notifications.getPermissionAsync();
    setPermissionStatus(hasPermission);

    if (!hasPermission) {
      const requested = await NotificationService.getOrRequestPermissionsAsync();
      if (requested) {
        setPermissionStatus(true);
      }
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    const hasPermission = await OneSignal.Notifications.getPermissionAsync();
    setPermissionStatus(hasPermission);
  }, []);

  useEffect(() => {
    if (user) {
      checkAndRequestPermissions();
    }
  }, [user?.id, checkAndRequestPermissions]);

  const fetchSettings = useCallback(async () => {
    LoggingService.info('SettingsContext', 'Starting fetchSettings...');
    setLoading(true);
    try {
      const initialSettings = await SettingsService.getSettings();
      if (initialSettings) {
        LoggingService.info('SettingsContext', 'Successfully fetched settings:', initialSettings);
        setSettings(initialSettings);
      } else {
        LoggingService.info('SettingsContext', 'No settings found in DB, using default values.');
        const defaultSettings: AppSettings = {
          notificationDays: 3,
          theme: 'auto',
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      LoggingService.error('SettingsContext', `FATAL: Failed to fetch settings: ${error}`);
      setSettings({
        notificationDays: 3,
        theme: 'auto',
      } as AppSettings);
    } finally {
      LoggingService.info('SettingsContext', 'fetchSettings finished, setting loading to false.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSettings();
      const unsubscribe = SettingsService.listenToSettings((newSettings) => {
        setSettings(convertSettingsToCamelCase(newSettings as unknown as Record<string, unknown>));
      });
      return () => unsubscribe();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [user?.id, fetchSettings]);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!settings) {
      LoggingService.error('SettingsContext', 'Cannot update settings, current settings are null.');
      return;
    }
    LoggingService.info('SettingsContext', 'Attempting optimistic update with:', newSettings);
    setSettings(current => ({ ...current!, ...newSettings }));
    try {
      const updatedSettings = await SettingsService.updateSettings(newSettings);
      LoggingService.info('SettingsContext', 'Update call to SettingsService successful.');
      if (updatedSettings) {
        eventEmitter.emit('settingsChanged', updatedSettings);
      }
    } catch (error) {
      LoggingService.error('SettingsContext', `Failed to update settings, rolling back: ${error}`);
      fetchSettings();
    }
  };

  const contextValue = useMemo(
    () => ({
      settings,
      loading,
      permissionStatus,
      updateSettings,
      refreshPermissions,
    }),
    [settings, loading, permissionStatus, updateSettings, refreshPermissions]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
