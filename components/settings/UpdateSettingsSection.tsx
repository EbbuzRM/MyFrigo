import React, { useCallback } from 'react';
import { View, Text, Switch, ActivityIndicator, StyleSheet } from 'react-native';
import { SettingsCard } from '@/components/SettingsCard';
import { SettingsSection } from './SettingsSection';
import { useTheme } from '@/context/ThemeContext';
import {
  createUpdateCards,
  UpdateCardConfig,
} from '@/constants/settings';

/**
 * @file components/settings/UpdateSettingsSection.tsx
 * @description Section component for update-related settings.
 * Manages auto-check, auto-install, and manual update check cards.
 *
 * @example
 * ```tsx
 * <UpdateSettingsSection
 *   autoCheckEnabled={true}
 *   autoInstallEnabled={false}
 *   onAutoCheckToggle={(value) => handleToggle('autoCheck', value)}
 *   onAutoInstallToggle={(value) => handleToggle('autoInstall', value)}
 *   onCheckUpdates={handleCheckUpdates}
 *   isChecking={false}
 *   isDownloading={false}
 *   lastUpdateInfo={null}
 *   isUpdateAvailable={false}
 *   onInstallUpdate={openUpdateModal}
 * />
 * ```
 */

/**
 * Props for UpdateSettingsSection component
 */
export interface UpdateSettingsSectionProps {
  /** Whether automatic update checking is enabled */
  autoCheckEnabled: boolean;
  /** Whether automatic update installation is enabled */
  autoInstallEnabled: boolean;
  /** Callback when auto-check toggle changes */
  onAutoCheckToggle: (value: boolean) => void;
  /** Callback when auto-install toggle changes */
  onAutoInstallToggle: (value: boolean) => void;
  /** Callback when manual check is requested */
  onCheckUpdates: () => void;
  /** Whether update check is in progress */
  isChecking: boolean;
  /** Whether update download is in progress */
  isDownloading: boolean;
  /** Last update check info */
  lastUpdateInfo: { isAvailable: boolean; availableVersion?: string } | null;
  /** Whether an update is available */
  isUpdateAvailable: boolean;
  /** Callback when install update is requested */
  onInstallUpdate: () => void;
}

/**
 * UpdateSettingsSection component
 *
 * Displays update-related settings including automatic checks,
 * automatic installation, manual check, and install update.
 *
 * @param props - Component props
 * @returns UpdateSettingsSection component
 */
export function UpdateSettingsSection({
  autoCheckEnabled,
  autoInstallEnabled,
  onAutoCheckToggle,
  onAutoInstallToggle,
  onCheckUpdates,
  isChecking,
  isDownloading,
  lastUpdateInfo,
  isUpdateAvailable,
  onInstallUpdate,
}: UpdateSettingsSectionProps): React.ReactElement {
  const { isDarkMode } = useTheme();
  const cards = createUpdateCards(isDarkMode);

  const getCardDescription = useCallback(
    (card: UpdateCardConfig): string | undefined => {
      if (card.id === 'check-updates' && lastUpdateInfo?.isAvailable) {
        return `Disponibile v${lastUpdateInfo.availableVersion}`;
      }
      return card.description;
    },
    [lastUpdateInfo]
  );

  const getCardControl = useCallback(
    (card: UpdateCardConfig): React.ReactNode => {
      switch (card.id) {
        case 'auto-check':
          return (
            <Switch
              testID="auto-check-switch"
              value={autoCheckEnabled}
              onValueChange={onAutoCheckToggle}
              trackColor={{ false: '#e5e7eb', true: '#4ade80' }}
              thumbColor={autoCheckEnabled ? '#16a34a' : '#f1f5f9'}
              accessibilityLabel={card.accessibilityLabel}
            />
          );
        case 'auto-install':
          return (
            <Switch
              testID="auto-install-switch"
              value={autoInstallEnabled}
              onValueChange={onAutoInstallToggle}
              trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
              thumbColor={autoInstallEnabled ? '#2563eb' : '#f1f5f9'}
              accessibilityLabel={card.accessibilityLabel}
            />
          );
        case 'check-updates':
          return isChecking || isDownloading ? (
            <ActivityIndicator size="small" color={isDarkMode ? '#a78bfa' : '#7c3aed'} />
          ) : null;
        default:
          return null;
      }
    },
    [
      autoCheckEnabled,
      autoInstallEnabled,
      onAutoCheckToggle,
      onAutoInstallToggle,
      isChecking,
      isDownloading,
      isDarkMode,
    ]
  );

  return (
    <SettingsSection title="Aggiornamenti">
      {cards.map((card) => (
        <SettingsCard
          key={card.id}
          icon={card.icon}
          title={card.title}
          description={getCardDescription(card)}
          control={getCardControl(card)}
          onPress={card.id === 'check-updates' ? onCheckUpdates : undefined}
        />
      ))}
      {isUpdateAvailable && (
        <SettingsCard
          icon={cards[1].icon}
          title="Installa Aggiornamento"
          description={`Aggiorna alla versione ${lastUpdateInfo?.availableVersion}`}
          onPress={onInstallUpdate}
        />
      )}
    </SettingsSection>
  );
}
