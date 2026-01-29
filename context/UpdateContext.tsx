import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UpdateService, UpdateInfo, UpdateSettings, UpdateEventEmitter } from '@/services/UpdateService';
import { UpdateModal } from '@/components/UpdateModal';
import { LoggingService } from '@/services/LoggingService';

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

  // Inizializza il servizio e carica le impostazioni
  useEffect(() => {
    const initializeUpdateService = async () => {
      try {
        await UpdateService.initialize();
        await loadSettings();
        setupEventListeners();
        
        // Esegui un check automatico se necessario
        await performAutoCheck();
      } catch (error) {
        LoggingService.error('UpdateProvider', 'Errore durante l\'inizializzazione:', error);
      }
    };

    initializeUpdateService();

    // Cleanup dei listener eventi al unmount
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
    // In futuro potremmo salvare le impostazioni in AsyncStorage o Supabase
    // Per ora usiamo le impostazioni di default
    setSettings(defaultSettings);
  };

  const updateSettings = async (newSettings: Partial<UpdateSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Salva le impostazioni (in futuro in AsyncStorage o Supabase)
    LoggingService.info('UpdateProvider', 'Impostazioni aggiornate:', updatedSettings);
  };

  const setupEventListeners = () => {
    // Ascolta gli eventi di aggiornamento
    UpdateEventEmitter.on('updateChecked', (updateInfo: UpdateInfo | null) => {
      setIsChecking(false);
      if (updateInfo) {
        setLastUpdateInfo(updateInfo);
        
        // Mostra automaticamente il modal se c'è un aggiornamento disponibile
        if (updateInfo.isAvailable) {
          setModalUpdateInfo(updateInfo);
          setShowUpdateModal(true);
        }
      }
    });

    UpdateEventEmitter.on('updateError', (updateInfo: UpdateInfo | null) => {
      setIsChecking(false);
      LoggingService.error('UpdateProvider', 'Errore durante check aggiornamenti');
    });

    UpdateEventEmitter.on('updateDownloaded', (updateInfo: UpdateInfo | null) => {
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
    if (UpdateService.shouldCheckForUpdates(settings)) {
      try {
        LoggingService.info('UpdateProvider', 'Esecuzione check automatico aggiornamenti...');
        const updateInfo = await UpdateService.performAutoCheck(settings);
        
        if (updateInfo && updateInfo.isAvailable) {
          setLastUpdateInfo(updateInfo);
          
          // Mostra il modal solo se non è auto-install
          if (!settings.autoInstallEnabled) {
            setModalUpdateInfo(updateInfo);
            setShowUpdateModal(true);
          }
        }
      } catch (error) {
        LoggingService.error('UpdateProvider', 'Errore durante check automatico:', error);
      }
    }
  };

  const openModal = () => {
    if (lastUpdateInfo?.isAvailable) {
      setModalUpdateInfo(lastUpdateInfo);
      setShowUpdateModal(true);
    } else {
      // Se non c'è un update info, ne cerchiamo uno nuovo
      checkForUpdates().then((updateInfo) => {
        if (updateInfo.isAvailable) {
          setModalUpdateInfo(updateInfo);
          setShowUpdateModal(true);
        } else {
          // Potremmo mostrare un messaggio "L'app è aggiornata"
          LoggingService.info('UpdateProvider', 'Nessun aggiornamento disponibile');
        }
      });
    }
  };

  const hideModal = () => {
    setShowUpdateModal(false);
    setModalUpdateInfo(null);
  };

  const contextValue: UpdateContextType = {
    checkForUpdates,
    isChecking,
    isDownloading,
    lastUpdateInfo,
    settings,
    updateSettings,
    showModal: showUpdateModal,
    hideModal,
    openModal,
  };

  return (
    <UpdateContext.Provider value={contextValue}>
      {children}
    </UpdateContext.Provider>
  );
};
};