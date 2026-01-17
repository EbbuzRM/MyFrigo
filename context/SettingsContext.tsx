import { convertSettingsToCamelCase } from '../utils/caseConverter';
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { SettingsService, AppSettings } from '@/services/SettingsService';
import { useAuth } from './AuthContext';
import { eventEmitter } from '@/services/NotificationService';
import { NotificationService } from '@/services/NotificationService'; // Importa il servizio
import * as Notifications from 'expo-notifications'; // Importa per il tipo
import { LoggingService } from '@/services/LoggingService';

type PermissionStatus = Notifications.PermissionStatus | 'granted';

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
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);

  const checkAndRequestPermissions = useCallback(async () => {
    LoggingService.info('SettingsContext', 'Checking notification permissions...');
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status as Notifications.PermissionStatus | null);

    if (status !== 'granted') {
      const requested = await NotificationService.getOrRequestPermissionsAsync();
      if (requested) {
        setPermissionStatus('granted' as Notifications.PermissionStatus);
      }
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status as Notifications.PermissionStatus | null);
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

  return (
    <SettingsContext.Provider value={{ settings, loading, permissionStatus, updateSettings, refreshPermissions }}>
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
