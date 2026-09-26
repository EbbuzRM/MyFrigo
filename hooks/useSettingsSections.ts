// useSettingsSections.ts — useSettingsSections module.
//
// exports: UseSettingsSectionsReturn | useSettingsSections
// used_by: none
// rules:   - All exported interfaces and types must remain backward compatible; any property additions must be optional to not break consumers
//          - The `cardId` parameter in `handleCardPress` must map exactly to the keys defined in `SettingsSectionConfig` from `@/constants/settings`
//          - All async operations (save handlers, loading) must integrate with existing context providers (`SettingsContext`, `UpdateContext`), not bypass them
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useMemo, useCallback, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
  const { isDarkMode, setAppTheme } = useTheme();
  const { settings, updateSettings } = useAppSettings();
  const {
    checkForUpdates,
    isChecking,
    isDownloading,
    lastUpdateInfo,
    updateSettings: updateAppUpdateSettings,
    openModal: openUpdateModal,
  } = useUpdate();

  // Generate sections based on current theme
  const sections = useMemo(() => getSettingsSections(isDarkMode), [isDarkMode, i18n.language]);

  // Notification days state (managed here for modal)
  const [modalVisible, setModalVisible] = useState(false);
  const [daysInput, setDaysInput] = useState(settings?.notificationDays?.toString() ?? '3');
  const [isSaving, setIsSaving] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    // Pulisci timer precedente se esiste
    if (showToastTimeoutRef.current) {
      clearTimeout(showToastTimeoutRef.current);
      showToastTimeoutRef.current = null;
    }
    setToast(null);
    // Small delay to ensure state reset triggers re-render
    showToastTimeoutRef.current = setTimeout(() => {
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
    if (showToastTimeoutRef.current) {
      clearTimeout(showToastTimeoutRef.current);
      showToastTimeoutRef.current = null;
    }
  }, []);

  /**
   * Handle notification days save
   */
  const handleSaveNotificationDays = useCallback(async () => {
    const days = parseInt(daysInput, 10);
    if (isNaN(days) || days < 1 || days > 30) {
      showToast(t('settings.invalidDays'), 'error');
      return;
    }

    try {
      setIsSaving(true);
      await updateSettings({ notificationDays: days });
      showToast(t('settings.daysSaved', { count: days }));
      setModalVisible(false);
    } catch (error) {
      LoggingService.error('Settings', 'Errore durante il salvataggio delle impostazioni:', error);
      showToast(t('settings.saveFailed'), 'error');
    } finally {
      setIsSaving(false);
    }
  }, [daysInput, updateSettings, showToast, t]);

  /**
   * Handle clear data action with confirmation
   */
  const handleClearData = useCallback(() => {
    Alert.alert(
      t('settings.clearConfirmTitle'),
      t('settings.clearConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              Alert.alert(
                t('settings.clearUnavailableTitle'),
                t('settings.clearUnavailableMessage')
              );
            } catch {
              showToast(t('settings.saveFailed'), 'error');
            }
          },
        },
      ]
    );
  }, [showToast, t]);

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
            // Rimosso LoggingService.warning per evitare rumore nei log di produzione
            // per ID di card non riconosciuti che potrebbero essere temporanei o in fase di sviluppo.
            break;
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
        showToast(t('settings.updateAvailable', { version: updateInfo.availableVersion }), 'success');
      } else {
        showToast(t('settings.upToDate'), 'success');
      }
    } catch (error) {
      LoggingService.error('Settings', 'Errore durante controllo aggiornamenti:', error);
      showToast(t('settings.updateCheckFailed'), 'error');
    }
  }, [checkForUpdates, showToast, t]);

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
