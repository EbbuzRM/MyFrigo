import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUpdates, reloadAsync } from 'expo-updates';
import { UpdateService, UpdateInfo, UpdateSettings, UpdateEventEmitter } from '@/services/UpdateService';
import { UpdateModal } from '@/components/UpdateModal';
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
  lastCheckTime: 0,
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastUpdateInfo, setLastUpdateInfo] = useState<UpdateInfo | null>(null);
  const [settings, setSettings] = useState<UpdateSettings>(defaultSettings);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // FIX RADICE: Usa useUpdates() hook invece di addListener (deprecato in SDK 51+)
  const updates = useUpdates();

   // Refs per timer cleanup
  const showToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast(null);
    // Pulisci timer precedente se esiste
    if (showToastTimeoutRef.current) {
      clearTimeout(showToastTimeoutRef.current);
      showToastTimeoutRef.current = null;
    }
    showToastTimeoutRef.current = setTimeout(() => {
      setToast({ message, type });
    }, 100);
  };

  const hideToast = () => {
    setToast(null);
  };

  // Ref per avere sempre l'ultimo valore dei settings nei listener
  const settingsRef = React.useRef(settings);

  // Aggiorna il ref quando i settings cambiano
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Inizializza il servizio e carica impostazioni
  useEffect(() => {
    const initializeUpdateService = async () => {
      try {
        await UpdateService.initialize();
        await loadSettings();
        setupEventListeners();
      } catch (error) {
        LoggingService.error('UpdateProvider', 'Errore durante l\'inizializzazione:', error);
      }
    };

    initializeUpdateService();

    return () => {
      UpdateEventEmitter.removeAllListeners('updateChecked');
      UpdateEventEmitter.removeAllListeners('updateError');
      UpdateEventEmitter.removeAllListeners('updateDownloaded');
      UpdateEventEmitter.removeAllListeners('downloadError');
      UpdateEventEmitter.removeAllListeners('appRestarting');
      UpdateEventEmitter.removeAllListeners('restartError');
      // Cleanup timer toast
      if (showToastTimeoutRef.current) {
        clearTimeout(showToastTimeoutRef.current);
      }
    };
  }, []);

  // FIX RADICE: Monitora lo stato di useUpdates() invece di usare addListener deprecato
  useEffect(() => {
    const { isUpdatePending, availableUpdate, currentlyRunning } = updates;

    if (isUpdatePending && availableUpdate) {
      LoggingService.info('UpdateProvider', 'Aggiornamento scaricato, pronto per l\'installazione');
      
      // Fix accesso sicuro alle proprietà del manifest (il tipo esatto dipende dalla versione expo-updates)
      const manifestAny = availableUpdate.manifest as any;
      
      const updateInfo: UpdateInfo = {
        isAvailable: true,
        isUpdatePending: true,
        currentVersion: currentlyRunning.updateId || 'unknown',
        availableVersion: manifestAny?.extra?.version || manifestAny?.runtimeVersion || 'unknown',
        manifest: availableUpdate.manifest as UpdateInfo['manifest'],
      };
      
      setLastUpdateInfo(updateInfo);
      setIsDownloading(false);
      
      if (settingsRef.current.autoInstallEnabled) {
        LoggingService.info('UpdateProvider', 'Auto-install abilitato, riavvio dell\'app...');
        reloadAsync();
      } else {
        setShowUpdateModal(true);
      }
    }
  }, [updates.isUpdatePending, updates.availableUpdate, updates.currentlyRunning]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(UPDATE_SETTINGS_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings(parsedSettings);
        LoggingService.info('UpdateProvider', 'Impostazioni caricate da AsyncStorage:', parsedSettings);
      } else {
        setSettings(defaultSettings);
        LoggingService.info('UpdateProvider', 'Nessuna impostazione salvata, uso default');
      }
    } catch (error) {
      LoggingService.error('UpdateProvider', 'Errore durante il caricamento delle impostazioni:', error);
      setSettings(defaultSettings);
    }
  };

  const updateSettings = async (newSettings: Partial<UpdateSettings>) => {
    setSettings(current => {
      const updated = { ...current, ...newSettings };
      // Salvataggio asincrono fuori dal render
      AsyncStorage.setItem(UPDATE_SETTINGS_KEY, JSON.stringify(updated))
        .then(() => LoggingService.info('UpdateProvider', 'Impostazioni salvate:', updated))
        .catch(err => LoggingService.error('UpdateProvider', 'Errore salvataggio:', err));
      return updated;
    });
  };

  const setupEventListeners = () => {
    UpdateEventEmitter.on('updateChecked', (updateInfo: UpdateInfo | null) => {
      setIsChecking(false);
      if (updateInfo) {
        setLastUpdateInfo(updateInfo);

        // Usa il ref per evitare stale closure!
        const currentSettings = settingsRef.current;
        if (updateInfo.isAvailable && !currentSettings.autoInstallEnabled) {
          setShowUpdateModal(true);
        }
      }
    });

    UpdateEventEmitter.on('updateError', () => {
      setIsChecking(false);
      LoggingService.error('UpdateProvider', 'Errore durante check aggiornamenti');
    });

    UpdateEventEmitter.on('updateDownloaded', () => {
      setIsDownloading(false);
      LoggingService.info('UpdateProvider', 'Aggiornamento scaricato con successo');
    });

    UpdateEventEmitter.on('downloadError', () => {
      setIsDownloading(false);
      LoggingService.error('UpdateProvider', 'Errore durante download aggiornamento');
    });

    UpdateEventEmitter.on('appRestarting', () => {
      LoggingService.info('UpdateProvider', 'App in riavvio per applicare aggiornamento');
    });

    UpdateEventEmitter.on('restartError', () => {
      LoggingService.error('UpdateProvider', 'Errore durante riavvio app');
    });
  };

  const checkForUpdates = async (): Promise<UpdateInfo> => {
    setIsChecking(true);
    try {
      const updateInfo = await UpdateService.checkForUpdate();
      setLastUpdateInfo(updateInfo);
      return updateInfo;
    } catch (error) {
      LoggingService.error('UpdateProvider', 'Errore durante check aggiornamenti:', error);
      throw error;
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Apre il modal degli aggiornamenti.
   * Se c'è già un update rilevato lo mostra, altrimenti esegue un check.
   * Essendo un'azione manuale, mostra sempre il modal se c'è un update disponibile.
   */
  const openModal = async () => {
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
  };

  const hideModal = () => {
    setShowUpdateModal(false);
  };

  const resetUpdateState = () => {
    setLastUpdateInfo(null);
    setShowUpdateModal(false);
  };

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
  }), [isChecking, isDownloading, lastUpdateInfo, settings, showUpdateModal, toast]);

  return (
    <UpdateContext.Provider value={contextValue}>
      {children}
    </UpdateContext.Provider>
  );
};