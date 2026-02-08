import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [modalUpdateInfo, setModalUpdateInfo] = useState<UpdateInfo | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast(null);
    setTimeout(() => {
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

  // Traccia se l'app è stata riavviata di recente (per evitare check immediati)
  const [justRestarted, setJustRestarted] = useState(true);
  const appStartTime = useState(() => Date.now())[0];

  // Inizializza il servizio e carica le impostazioni
  useEffect(() => {
    const initializeUpdateService = async () => {
      try {
        await UpdateService.initialize();
        await loadSettings();
        setupEventListeners();

        // Attendi 3 secondi prima di eseguire il check automatico
        setTimeout(async () => {
          setJustRestarted(false);
          await performAutoCheck();
        }, 3000);
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
    };
  }, []);

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
          setModalUpdateInfo(updateInfo);
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

  const performAutoCheck = async () => {
    const timeSinceStart = Date.now() - appStartTime;
    if (timeSinceStart < 5000) return;

    const currentSettings = settingsRef.current;
    if (UpdateService.shouldCheckForUpdates(currentSettings)) {
      try {
        LoggingService.info('UpdateProvider', 'Esecuzione check automatico aggiornamenti...');
        const updateInfo = await UpdateService.performAutoCheck(currentSettings);

        if (updateInfo && updateInfo.isAvailable) {
          setLastUpdateInfo(updateInfo);
          if (!currentSettings.autoInstallEnabled) {
            setModalUpdateInfo(updateInfo);
            setShowUpdateModal(true);
          }
        } else {
          setLastUpdateInfo(null);
        }
      } catch (error) {
        LoggingService.error('UpdateProvider', 'Errore durante check automatico:', error);
      }
    }
  };

  /**
   * Apre il modal degli aggiornamenti.
   * Se c'è già un update rilevato lo mostra, altrimenti esegue un check.
   * Essendo un'azione manuale, mostra sempre il modal se c'è un update disponibile.
   */
  const openModal = async () => {
    if (lastUpdateInfo?.isAvailable) {
      setModalUpdateInfo(lastUpdateInfo);
      setShowUpdateModal(true);
    } else {
      try {
        const updateInfo = await checkForUpdates();
        if (updateInfo.isAvailable) {
          setModalUpdateInfo(updateInfo);
          setShowUpdateModal(true);
        }
      } catch (error) {
        LoggingService.error('UpdateContext', 'Errore in openModal:', error);
      }
    }
  };

  const hideModal = () => {
    setShowUpdateModal(false);
    setModalUpdateInfo(null);
  };

  const resetUpdateState = () => {
    setLastUpdateInfo(null);
    setModalUpdateInfo(null);
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