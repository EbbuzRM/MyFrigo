import { useMemo, useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getSettingsSections, SettingsSectionConfig } from '@/constants/settings';
import { LoggingService } from '@/services/LoggingService';
import { useTheme } from '@/context/ThemeContext';
import { useSettings as useAppSettings } from '@/context/SettingsContext';
import { useUpdate } from '@/context/UpdateContext';

/**
 * @file hooks/useSettingsSections.ts
 * @description Hook to manage settings sections configuration and handlers.
 * Encapsulates all settings-related logic including section generation,
 * card press handlers, and modal visibility state.
 *
 * @example
 * ```tsx
 * const {
 *   sections,
 *   handlers,
 *   notificationDays,
 *   modalVisible,
 *   setModalVisible,
 *   isSaving,
 *   handleSaveNotificationDays
 * } = useSettingsSections();
 * ```
 */

/**
 * Return type for useSettingsSections hook
 */
export interface UseSettingsSectionsReturn {
  /** Generated settings sections configuration */
  sections: SettingsSectionConfig[];
  /** Current notification days value */
  notificationDays: number;
  /** Whether notification days modal is visible */
  modalVisible: boolean;
  /** Set modal visibility */
  setModalVisible: (visible: boolean) => void;
  /** Whether settings are being saved */
  isSaving: boolean;
  /** Current days input value */
  daysInput: string;
  /** Set days input value */
  setDaysInput: (value: string) => void;
  /** Save notification days */
  handleSaveNotificationDays: () => Promise<void>;
  /** Handle card press by ID */
  handleCardPress: (cardId: string) => void;
  /** Handle dark mode toggle */
  handleDarkModeToggle: (value: boolean) => void;
  /** Handle update setting toggle */
  handleUpdateSettingToggle: (key: string, value: boolean) => void;
  /** Handle manual update check */
  handleCheckUpdates: () => Promise<void>;
  /** Whether update check is in progress */
  isChecking: boolean;
  /** Whether update is downloading */
  isDownloading: boolean;
  /** Last update info */
  lastUpdateInfo: { isAvailable: boolean; availableVersion?: string } | null;
  /** Open update modal */
  openUpdateModal: () => void;
  /** Whether update is available */
  isUpdateAvailable: boolean;
  /** Show toast message */
  showToast: (message: string, type?: 'success' | 'error') => void;
  /** Current toast state */
  toast: { message: string; type: 'success' | 'error' } | null;
  /** Clear toast */
  clearToast: () => void;
}

/**
 * Hook to manage all settings sections and their handlers
 *
 * This hook consolidates all settings-related state and logic into a single,
 * reusable hook that can be consumed by the main settings screen.
 *
 * @returns Complete settings state and handlers
 */
export function useSettingsSections(): UseSettingsSectionsReturn {
  const { isDarkMode, setAppTheme } = useTheme();
  const { settings, updateSettings, loading } = useAppSettings();
  const {
    checkForUpdates,
    isChecking,
    isDownloading,
    lastUpdateInfo,
    settings: updateSettingsConfig,
    updateSettings: updateAppUpdateSettings,
    openModal: openUpdateModal,
  } = useUpdate();

  // Generate sections based on current theme
  const sections = useMemo(() => getSettingsSections(isDarkMode), [isDarkMode]);

  // Notification days state (managed here for modal)
  const [modalVisible, setModalVisible] = useState(false);
  const [daysInput, setDaysInput] = useState(settings?.notificationDays?.toString() ?? '3');
  const [isSaving, setIsSaving] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Update days input when settings change
  useMemo(() => {
    if (settings?.notificationDays !== undefined) {
      setDaysInput(settings.notificationDays.toString());
    }
  }, [settings?.notificationDays]);

  /**
   * Show toast notification
   */
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast(null);
    // Small delay to ensure state reset triggers re-render
    setTimeout(() => {
      setToast({ message, type });
      Haptics.notificationAsync(
        type === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
      );
    }, 100);
  }, []);

  /**
   * Clear toast notification
   */
  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  /**
   * Handle notification days save
   */
  const handleSaveNotificationDays = useCallback(async () => {
    const days = parseInt(daysInput, 10);
    if (isNaN(days) || days < 1 || days > 30) {
      showToast('Inserisci un numero di giorni valido (1-30).', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await updateSettings({ notificationDays: days });
      showToast(`Giorni di preavviso impostati a ${days}.`);
      setModalVisible(false);
    } catch (error) {
      LoggingService.error('Settings', 'Errore durante il salvataggio delle impostazioni:', error);
      showToast('Errore durante il salvataggio.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [daysInput, updateSettings, showToast]);

  /**
   * Handle clear data action with confirmation
   */
  const handleClearData = useCallback(() => {
    Alert.alert(
      'Conferma Eliminazione',
      'Sei sicuro di voler eliminare tutti i dati? Questa azione è irreversibile.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert(
                'Funzionalità temporaneamente non disponibile',
                'La cancellazione di tutti i dati sarà disponibile nei prossimi aggiornamenti.'
              );
              showToast('Tutti i dati sono stati eliminati.');
            } catch {
              showToast('Impossibile eliminare i dati.', 'error');
            }
          },
        },
      ]
    );
  }, [showToast]);

  /**
   * Handle card press by ID
   */
  const handleCardPress = useCallback(
    (cardId: string) => {
      switch (cardId) {
        case 'profile':
          router.push('/profile');
          break;
        case 'notification-days':
          setModalVisible(true);
          break;
        case 'categories':
          router.push('/manage-categories');
          break;
        case 'clear-data':
          handleClearData();
          break;
        case 'feedback':
          router.push('/feedback');
          break;
        case 'check-updates':
          handleCheckUpdates();
          break;
        default:
          LoggingService.warning('useSettingsSections', `Unknown card ID: ${cardId}`);
      }
    },
    [handleClearData]
  );

  /**
   * Handle dark mode toggle
   */
  const handleDarkModeToggle = useCallback(
    (value: boolean) => {
      setAppTheme(value ? 'dark' : 'light');
    },
    [setAppTheme]
  );

  /**
   * Handle update setting toggle
   */
  const handleUpdateSettingToggle = useCallback(
    (key: string, value: boolean) => {
      if (key === 'autoCheckEnabled') {
        updateAppUpdateSettings({ autoCheckEnabled: value });
      } else if (key === 'autoInstallEnabled') {
        updateAppUpdateSettings({ autoInstallEnabled: value });
      }
    },
    [updateAppUpdateSettings]
  );

  /**
   * Handle manual update check
   */
  const handleCheckUpdates = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const updateInfo = await checkForUpdates();

      if (updateInfo.isAvailable) {
        showToast(`Aggiornamento disponibile: v${updateInfo.availableVersion}`, 'success');
      } else {
        showToast("L'app è aggiornata all'ultima versione", 'success');
      }
    } catch (error) {
      LoggingService.error('Settings', 'Errore durante controllo aggiornamenti:', error);
      showToast('Errore durante il controllo aggiornamenti', 'error');
    }
  }, [checkForUpdates, showToast]);

  return {
    sections,
    notificationDays: settings?.notificationDays ?? 3,
    modalVisible,
    setModalVisible,
    isSaving,
    daysInput,
    setDaysInput,
    handleSaveNotificationDays,
    handleCardPress,
    handleDarkModeToggle,
    handleUpdateSettingToggle,
    handleCheckUpdates,
    isChecking,
    isDownloading,
    lastUpdateInfo,
    openUpdateModal,
    isUpdateAvailable: lastUpdateInfo?.isAvailable ?? false,
    showToast,
    toast,
    clearToast,
  };
}
