// UpdateContext.tsx — UpdateContext module.
//
// exports: useUpdate | UpdateProvider
// used_by: app\(tabs)\settings.tsx
//                   app\__tests__\settings.test.tsx
//                   app\_layout.tsx
//                   components\AppProviders.tsx
//                   hooks\useSettingsSections.ts
// rules:   - The UpdateProvider component must remain as a single React context provider wrapping the entire update subsystem; do not split it into multiple providers or mix concerns with other contexts.
//          - All AsyncStorage read/write operations for update settings must use the UPDATE_SETTINGS_KEY constant exclusively; no hardcoded keys or alternative storage keys allowed.
//          - Manual update lifecycle (check, download, install) goes through the global UpdateService singleton; the automatic flow uses the expo-updates `useUpdates()` hook and must call `UpdateService.markUpdatePending()` once an update is downloaded so both flows share state.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message:

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useUpdates, reloadAsync, fetchUpdateAsync, checkForUpdateAsync } from 'expo-updates';
import { UpdateService, UpdateInfo, UpdateSettings, UpdateEventEmitter } from '@/services/UpdateService';
import { getManifestVersion } from '@/services/update/UpdateService.metadata';
import { LoggingService } from '@/services/LoggingService';

// Chiave per salvare le impostazioni di aggiornamento in AsyncStorage
const UPDATE_SETTINGS_KEY = '@myfrigo_update_settings';

interface UpdateContextType {
  checkForUpdates: () => Promise<UpdateInfo>;
  isChecking: boolean;
  isDownloading: boolean;
  lastUpdateInfo: UpdateInfo | null;
  settings: UpdateSettings;
  updateSettings: (newSettings: Partial<UpdateSettings>) => Promise<void>;
  showModal: boolean;
  hideModal: () => void;
  openModal: () => void;
  resetUpdateState: () => void;
  toast: { message: string, type: 'success' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  hideToast: () => void;
}

interface UpdateProviderProps {
  children: ReactNode;
}

const defaultSettings: UpdateSettings = {
  autoCheckEnabled: true,
  autoInstallEnabled: true,
  checkInterval: 24,
};

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export const useUpdate = () => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate must be used within an UpdateProvider');
  }
  return context;
};

export const UpdateProvider: React.FC<UpdateProviderProps> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [lastUpdateInfo, setLastUpdateInfo] = useState<UpdateInfo | null>(null);
  const [settings, setSettings] = useState<UpdateSettings>(defaultSettings);
  // Le azioni automatiche (download/auto-install) aspettano le preferenze reali dell'utente
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  // Incrementato al rientro in foreground per ri-eseguire l'effetto di download
  const [retryNonce, setRetryNonce] = useState(0);

  // FIX RADICE: Usa useUpdates() hook invece di addListener (deprecato in SDK 51+)
  const updates = useUpdates();
  // isDownloading deriva dallo stato nativo (copre sia download automatici che manuali)
  const isDownloading = !!updates.isDownloading;

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Ref per avere sempre l'ultimo valore di settings / updates nei listener
  const settingsRef = useRef(settings);
  const updatesRef = useRef(updates);
  updatesRef.current = updates;

  // Inizializza il servizio, registra i listener (sincrono: il cleanup è sempre coerente) e carica le impostazioni
  useEffect(() => {
    const unsubscribers = [
      UpdateEventEmitter.on('updateChecked', (updateInfo: UpdateInfo | null) => {
        setIsChecking(false);
        if (updateInfo) {
          setLastUpdateInfo(updateInfo);

          // Usa il ref per evitare stale closure!
          if (updateInfo.isAvailable && !settingsRef.current.autoInstallEnabled) {
            setShowUpdateModal(true);
          }
        }
      }),
      UpdateEventEmitter.on('updateError', () => {
        setIsChecking(false);
        LoggingService.error('UpdateProvider', 'Errore durante check aggiornamenti');
      }),
      UpdateEventEmitter.on('updateDownloaded', () => {
        LoggingService.info('UpdateProvider', 'Aggiornamento scaricato con successo');
      }),
      UpdateEventEmitter.on('downloadError', () => {
        LoggingService.error('UpdateProvider', 'Errore durante download aggiornamento');
      }),
      UpdateEventEmitter.on('appRestarting', () => {
        LoggingService.info('UpdateProvider', 'App in riavvio per applicare aggiornamento');
      }),
      UpdateEventEmitter.on('restartError', () => {
        LoggingService.error('UpdateProvider', 'Errore durante riavvio app');
      }),
    ];

    let cancelled = false;
    const initialize = async () => {
      try {
        await UpdateService.initialize();
        const stored = await AsyncStorage.getItem(UPDATE_SETTINGS_KEY);
        if (cancelled) return;
        if (stored) {
          const parsedSettings: UpdateSettings = { ...defaultSettings, ...JSON.parse(stored) };
          settingsRef.current = parsedSettings;
          setSettings(parsedSettings);
          LoggingService.info('UpdateProvider', 'Impostazioni caricate da AsyncStorage:', parsedSettings);
        } else {
          LoggingService.info('UpdateProvider', 'Nessuna impostazione salvata, uso default');
        }
      } catch (error) {
        LoggingService.error('UpdateProvider', 'Errore durante l\'inizializzazione:', error);
      } finally {
        if (!cancelled) setSettingsLoaded(true);
      }
    };
    initialize();

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') unsubscribe();
      });
    };
  }, []);

  // FIX RADICE: Monitora lo stato di useUpdates() — gestisce sia il download che l'installazione
  // FLUSSO CORRETTO:
  //   1. checkAutomatically: "ON_LOAD" → expo-updates fa checkForUpdateAsync() all'avvio
  //   2. isUpdateAvailable diventa true → (se controllo automatico attivo) fetchUpdateAsync()
  //   3. isUpdatePending diventa true → auto-reload o mostra modal
  const fetchAttemptedRef = useRef(false);
  const reloadRequestedRef = useRef(false);

  useEffect(() => {
    if (!settingsLoaded) return;
    const { isUpdateAvailable, isUpdatePending, availableUpdate } = updates;
    const currentSettings = settingsRef.current;

    // STEP 1: Aggiornamento disponibile ma non ancora scaricato → scaricalo
    if (isUpdateAvailable && !isUpdatePending && !fetchAttemptedRef.current) {
      if (!currentSettings.autoCheckEnabled) return; // download automatico disattivato dall'utente
      fetchAttemptedRef.current = true;
      LoggingService.info('UpdateProvider', 'Aggiornamento disponibile, avvio download automatico...');
      fetchUpdateAsync().catch((error) => {
        LoggingService.error('UpdateProvider', 'Errore durante fetchUpdateAsync:', error);
        // Il retry parte al rientro in foreground (retryNonce)
        fetchAttemptedRef.current = false;
      });
      return;
    }

    // STEP 2: Aggiornamento scaricato e pronto per l'installazione
    if (isUpdatePending && availableUpdate) {
      LoggingService.info('UpdateProvider', 'Aggiornamento scaricato, pronto per l\'installazione');
      // Allinea il servizio: restartApp/downloadUpdate devono sapere che l'update è già pronto
      UpdateService.markUpdatePending();

      const manifest = availableUpdate.manifest as UpdateInfo['manifest'];
      const updateInfo: UpdateInfo = {
        isAvailable: true,
        isUpdatePending: true,
        currentVersion: Constants.expoConfig?.version || 'unknown',
        availableVersion: getManifestVersion(manifest),
        manifest,
      };

      setLastUpdateInfo(updateInfo);

      if (currentSettings.autoInstallEnabled) {
        if (reloadRequestedRef.current) return;
        reloadRequestedRef.current = true;
        LoggingService.info('UpdateProvider', 'Auto-install abilitato, riavvio dell\'app...');
        Promise.resolve(reloadAsync()).catch((error) => {
          LoggingService.error('UpdateProvider', 'Errore durante reloadAsync:', error);
          reloadRequestedRef.current = false;
        });
      } else {
        setShowUpdateModal(true);
      }
    }
  }, [updates.isUpdateAvailable, updates.isUpdatePending, updates.availableUpdate, settingsLoaded, retryNonce]);

  // "Ripresa": al rientro in foreground riprova un download fallito e, scaduto
  // l'intervallo impostato, ricontrolla (expo-updates controlla da solo solo all'avvio).
  useEffect(() => {
    if (__DEV__) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const currentSettings = settingsRef.current;
      const {
        isUpdatePending,
        isChecking: nativeChecking,
        isDownloading: nativeDownloading,
        lastCheckForUpdateTimeSinceRestart,
      } = updatesRef.current;
      if (!currentSettings.autoCheckEnabled || isUpdatePending || nativeChecking || nativeDownloading) return;

      fetchAttemptedRef.current = false;
      setRetryNonce((n) => n + 1);

      const lastCheck = lastCheckForUpdateTimeSinceRestart?.getTime() ?? 0;
      if (Date.now() - lastCheck >= currentSettings.checkInterval * 60 * 60 * 1000) {
        checkForUpdateAsync().catch((error) => {
          LoggingService.error('UpdateProvider', 'Errore durante il re-check in foreground:', error);
        });
      }
    });
    return () => subscription.remove();
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<UpdateSettings>) => {
    const updated = { ...settingsRef.current, ...newSettings };
    settingsRef.current = updated;
    setSettings(updated);
    try {
      await AsyncStorage.setItem(UPDATE_SETTINGS_KEY, JSON.stringify(updated));
      LoggingService.info('UpdateProvider', 'Impostazioni salvate:', updated);
    } catch (err) {
      LoggingService.error('UpdateProvider', 'Errore salvataggio:', err);
    }
  }, []);

  const checkForUpdates = useCallback(async (): Promise<UpdateInfo> => {
    setIsChecking(true);
    try {
      const updateInfo = await UpdateService.checkForUpdate();
      setLastUpdateInfo(updateInfo);

      // Se in modalità sviluppo, mostra un messaggio chiaro all'utente
      if (updateInfo.isDevMode) {
        showToast('Aggiornamenti non disponibili in modalità sviluppo', 'error');
      }

      return updateInfo;
    } catch (error) {
      LoggingService.error('UpdateProvider', 'Errore durante check aggiornamenti:', error);
      throw error;
    } finally {
      setIsChecking(false);
    }
  }, [showToast]);

  /**
   * Apre il modal degli aggiornamenti.
   * Se c'è già un update rilevato lo mostra, altrimenti esegue un check.
   * Essendo un'azione manuale, mostra sempre il modal se c'è un update disponibile.
   * In modalità sviluppo, mostra un messaggio esplicito.
   */
  const openModal = useCallback(async () => {
    // Se in DEV mode, dai feedback immediato senza tentare il check
    if (__DEV__) {
      showToast('Aggiornamenti OTA non disponibili in modalità sviluppo. Usa una build di produzione.', 'error');
      return;
    }

    if (lastUpdateInfo?.isAvailable) {
      setShowUpdateModal(true);
    } else {
      try {
        const updateInfo = await checkForUpdates();
        if (updateInfo.isAvailable) {
          setShowUpdateModal(true);
        }
      } catch (error) {
        LoggingService.error('UpdateContext', 'Errore in openModal:', error);
      }
    }
  }, [lastUpdateInfo, checkForUpdates, showToast]);

  const hideModal = useCallback(() => {
    setShowUpdateModal(false);
  }, []);

  const resetUpdateState = useCallback(() => {
    setLastUpdateInfo(null);
    setShowUpdateModal(false);
  }, []);

  const contextValue = React.useMemo(() => ({
    checkForUpdates,
    isChecking,
    isDownloading,
    lastUpdateInfo,
    settings,
    updateSettings,
    showModal: showUpdateModal,
    hideModal,
    openModal,
    resetUpdateState,
    toast,
    showToast,
    hideToast,
  }), [
    checkForUpdates, isChecking, isDownloading, lastUpdateInfo, settings, updateSettings,
    showUpdateModal, hideModal, openModal, resetUpdateState, toast, showToast, hideToast,
  ]);

  return (
    <UpdateContext.Provider value={contextValue}>
      {children}
    </UpdateContext.Provider>
  );
};
