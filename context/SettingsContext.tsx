import { snakeToCamel } from '@/utils/caseConverter';
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { StorageService, AppSettings } from '@/services/StorageService';
import { useAuth } from './AuthContext';
import { eventEmitter } from '@/services/NotificationService';
import { NotificationService } from '@/services/NotificationService'; // Importa il servizio
import * as Notifications from 'expo-notifications'; // Importa per il tipo

interface SettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  permissionStatus: Notifications.PermissionStatus | null; // Nuovo stato
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
    console.log('[SettingsContext] Checking notification permissions...');
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);

    if (status !== 'granted') {
      const requested = await NotificationService.getOrRequestPermissionsAsync();
      if (requested) {
        setPermissionStatus('granted');
      }
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  }, []);

  useEffect(() => {
    if (user) {
      checkAndRequestPermissions();
    }
  }, [user, checkAndRequestPermissions]);

  const fetchSettings = useCallback(async () => {
    console.log('[SettingsContext] Starting fetchSettings...');
    setLoading(true);
    try {
      const initialSettings = await StorageService.getSettings();
      if (initialSettings) {
        console.log('[SettingsContext] Successfully fetched settings:', initialSettings);
        setSettings(initialSettings);
      } else {
        console.log('[SettingsContext] No settings found in DB, using default values.');
        const defaultSettings = {
          notificationDays: 3,
          theme: 'auto',
        };
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('[SettingsContext] FATAL: Failed to fetch settings:', error);
      setSettings({
        notificationDays: 3,
        theme: 'auto',
      });
    } finally {
      console.log('[SettingsContext] fetchSettings finished, setting loading to false.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchSettings();
      const unsubscribe = StorageService.listenToSettings((newSettings) => {
        setSettings(snakeToCamel(newSettings));
      });
      return () => unsubscribe();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [user, fetchSettings]);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!settings) {
      console.error("[SettingsContext] Cannot update settings, current settings are null.");
      return;
    }
    console.log('[SettingsContext] Attempting optimistic update with:', newSettings);
    setSettings(current => ({ ...current!, ...newSettings }));
    try {
      const updatedSettings = await StorageService.updateSettings(newSettings);
      console.log('[SettingsContext] Update call to StorageService successful.');
      if (updatedSettings) {
        eventEmitter.emit('settingsChanged', updatedSettings);
      }
    } catch (error) {
      console.error("[SettingsContext] Failed to update settings, rolling back:", error);
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
