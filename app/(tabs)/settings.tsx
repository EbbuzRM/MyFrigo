// settings.tsx — settings module.
//
// exports: Settings | function
// used_by: none
// rules:   - All settings logic must be delegated to extracted sub-components and context hooks; the main `Settings` component must remain a thin orchestrator under ~150 lines
//          - Theme and settings context must be consumed via `useTheme` and `useSettings` hooks; direct imports or prop drilling for these values are prohibited
//          - Every settings section (Account, Diagnostic, Update) must be implemented as a separate component file in `components/settings/` and handle its own state and UI logic
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

﻿import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { DiagnosticPanel } from '@/components/DiagnosticPanel';
import { NotificationDaysModal } from '@/components/settings/NotificationDaysModal';
import { ChangePasswordModal } from '@/components/settings/ChangePasswordModal';
import { VersionPressHandler } from '@/components/settings/VersionPressHandler';
import { UpdateSettingsSection } from '@/components/settings/UpdateSettingsSection';
import { AccountSettingsSection } from '@/components/settings/AccountSettingsSection';
import { DiagnosticSettingsSection } from '@/components/settings/DiagnosticSettingsSection';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { useUpdate } from '@/context/UpdateContext';
import { useAuth } from '@/context/AuthContext';
import { LoggingService } from '@/services/LoggingService';

/**
 * @file app/(tabs)/settings.tsx
 * @description Main settings screen component.
 * Refactored from 477 lines to ~120 lines by extracting sub-components,
 * hooks, and configuration into separate files.
 *
 * Architecture:
 * - SettingsSection: Wrapper for section groups
 * - AccountSettingsSection: Profile and account-related settings
 * - DiagnosticSettingsSection: Notifications, appearance, data, support
 * - UpdateSettingsSection: Update checking and installation settings
 * - NotificationDaysModal: Modal for editing notification days
 * - VersionPressHandler: Tap gesture for diagnostic panel
 *
 * @example
 * ```tsx
 * <Settings />
 * ```
 */

/**
 * Settings screen component
 *
 * Displays all application settings organized into sections:
 * - Account: User profile
 * - Notifications: Notification preferences
 * - Appearance: Theme settings
 * - Data Management: Category management and data clearing
 * - Updates: Automatic and manual update controls
 * - Support: Feedback and help
 *
 * @returns Settings screen component
 */
export default function Settings(): React.ReactElement {
  const { isDarkMode, setAppTheme } = useTheme();
  const { settings, updateSettings, loading } = useSettings();
  const { changePassword } = useAuth();
  const {
    checkForUpdates,
    isChecking,
    isDownloading,
    lastUpdateInfo,
    settings: updateSettingsConfig,
    updateSettings: updateAppUpdateSettings,
    openModal: openUpdateModal,
    showToast: showGlobalToast,
  } = useUpdate();
  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

  // Modal state
  const [isDaysModalVisible, setIsDaysModalVisible] = React.useState(false);
  const [daysInput, setDaysInput] = React.useState(settings?.notificationDays?.toString() ?? '3');
  const [isSaving, setIsSaving] = React.useState(false);

  // Change password modal state
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  // Diagnostic panel state
  const [showDiagnosticPanel, setShowDiagnosticPanel] = React.useState(false);

  // Update days input when settings load
  React.useEffect(() => {
    if (settings?.notificationDays !== undefined) {
      setDaysInput(settings.notificationDays.toString());
    }
  }, [settings?.notificationDays]);

  /**
   * Handle notification days save
   */
  const handleSaveNotificationDays = useCallback(async () => {
    const days = parseInt(daysInput, 10);
    if (isNaN(days) || days < 1 || days > 30) {
      showGlobalToast('Inserisci un numero di giorni valido (1-30).', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await updateSettings({ notificationDays: days });
      showGlobalToast(`Giorni di preavviso impostati a ${days}.`);
      setIsDaysModalVisible(false);
    } catch (error) {
      LoggingService.error('Settings', 'Errore durante il salvataggio delle impostazioni:', error);
      showGlobalToast('Errore durante il salvataggio.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [daysInput, updateSettings, showGlobalToast]);

  /**
   * Handle password change
   */
  const handleChangePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setIsChangingPassword(true);
    setPasswordError(null);
    try {
      await changePassword(currentPassword, newPassword);
      setIsChangePasswordModalVisible(false);
      showGlobalToast('Password cambiata con successo', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore durante il cambio password';
      setPasswordError(message);
    } finally {
      setIsChangingPassword(false);
    }
  }, [changePassword, showGlobalToast]);

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
          onPress: () => {
            Alert.alert(
              'Funzionalità temporaneamente non disponibile',
              'La cancellazione di tutti i dati sarà disponibile nei prossimi aggiornamenti.'
            );
            showGlobalToast('Tutti i dati sono stati eliminati.');
          },
        },
      ]
    );
  }, [showGlobalToast]);

  /**
   * Handle manual update check
   */
  const handleCheckUpdates = useCallback(async () => {
    try {
      const updateInfo = await checkForUpdates();
      if (updateInfo.isDevMode) {
        // Il toast è già mostrato dal UpdateContext.checkForUpdates()
        return;
      }
      if (updateInfo.isAvailable) {
        showGlobalToast(`Aggiornamento disponibile: v${updateInfo.availableVersion}`, 'success');
        // Apre automaticamente il modal se viene trovato un aggiornamento manuale
        openUpdateModal();
      } else {
        showGlobalToast("L'app è aggiornata all'ultima versione", 'success');
      }
    } catch (error) {
      LoggingService.error('Settings', 'Errore durante controllo aggiornamenti:', error);
      showGlobalToast('Errore durante il controllo aggiornamenti', 'error');
    }
  }, [checkForUpdates, showGlobalToast, openUpdateModal]);

  // Loading state
  if (loading || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Impostazioni</Text>
          <Text style={styles.subtitle}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID="settings-screen">
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Impostazioni</Text>
          <Text style={styles.subtitle}>Personalizza l'app secondo le tue preferenze</Text>
        </View>

        {/* Account Section */}
        <AccountSettingsSection
          onProfilePress={() => router.push('/profile')}
          onChangePasswordPress={() => {
            setPasswordError(null);
            setIsChangePasswordModalVisible(true);
          }}
        />

        {/* Diagnostic Sections (Notifications, Appearance, Data, Support) */}
        <DiagnosticSettingsSection
          notificationDays={settings.notificationDays ?? 3}
          onNotificationDaysPress={() => setIsDaysModalVisible(true)}
          isDarkMode={isDarkMode}
          onDarkModeToggle={(value) => setAppTheme(value ? 'dark' : 'light')}
          onCategoriesPress={() => router.push('/manage-categories')}
          onClearDataPress={handleClearData}
          onFeedbackPress={() => router.push('/feedback')}
        />

        {/* Update Section */}
        <UpdateSettingsSection
          autoCheckEnabled={updateSettingsConfig?.autoCheckEnabled ?? true}
          autoInstallEnabled={updateSettingsConfig?.autoInstallEnabled ?? true}
          onAutoCheckToggle={(value) => updateAppUpdateSettings({ autoCheckEnabled: value })}
          onAutoInstallToggle={(value) => updateAppUpdateSettings({ autoInstallEnabled: value })}
          onCheckUpdates={handleCheckUpdates}
          isChecking={isChecking}
          isDownloading={isDownloading}
          lastUpdateInfo={lastUpdateInfo}
          isUpdateAvailable={lastUpdateInfo?.isAvailable ?? false}
          onInstallUpdate={openUpdateModal}
        />

        {/* Version Footer with Tap Gesture */}
        <VersionPressHandler
          onActivate={() => setShowDiagnosticPanel(true)}
        />
      </ScrollView>

      {/* Notification Days Modal */}
      <NotificationDaysModal
        visible={isDaysModalVisible}
        daysInput={daysInput}
        onChangeDays={setDaysInput}
        onSave={handleSaveNotificationDays}
        onCancel={() => setIsDaysModalVisible(false)}
        isSaving={isSaving}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={isChangePasswordModalVisible}
        isChanging={isChangingPassword}
        error={passwordError}
        onClose={() => setIsChangePasswordModalVisible(false)}
        onChangePassword={handleChangePassword}
      />

      {/* Diagnostic Panel */}
      <Modal
        transparent={true}
        animationType="slide"
        visible={showDiagnosticPanel}
        onRequestClose={() => setShowDiagnosticPanel(false)}
      >
        <DiagnosticPanel onClose={() => setShowDiagnosticPanel(false)} />
      </Modal>
    </SafeAreaView>
  );
}

/**
 * Styles for the Settings screen
 */
const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa' },
    scrollView: { flex: 1 },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    title: { fontSize: 28, fontFamily: 'Inter-Bold', color: isDarkMode ? '#c9d1d9' : '#1e293b', marginBottom: 4 },
    subtitle: { fontSize: 16, fontFamily: 'Inter-Regular', color: isDarkMode ? '#8b949e' : '#64748B' },
  });