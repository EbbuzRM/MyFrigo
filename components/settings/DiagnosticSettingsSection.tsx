import React from 'react';
import { Switch } from 'react-native';
import { SettingsCard } from '@/components/SettingsCard';
import { SettingsSection } from './SettingsSection';
import { useTheme } from '@/context/ThemeContext';
import {
  createAppearanceCards,
  createDataManagementCards,
  createNotificationCards,
  createSupportCards,
} from '@/constants/settings';

/**
 * @file components/settings/DiagnosticSettingsSection.tsx
 * @description Consolidated component for all remaining settings sections:
 * - Notifications (notification days)
 * - Appearance (dark mode)
 * - Data Management (categories, clear data)
 * - Support (feedback)
 *
 * @example
 * ```tsx
 * <DiagnosticSettingsSection
 *   notificationDays={3}
 *   onNotificationDaysPress={() => setModalVisible(true)}
 *   onDarkModeToggle={(value) => setTheme(value ? 'dark' : 'light')}
 *   onCategoriesPress={() => router.push('/manage-categories')}
 *   onClearDataPress={handleClearData}
 *   onFeedbackPress={() => router.push('/feedback')}
 * />
 * ```
 */

/**
 * Props for DiagnosticSettingsSection component
 */
export interface DiagnosticSettingsSectionProps {
  /** Current notification days value */
  notificationDays: number;
  /** Callback when notification days card is pressed */
  onNotificationDaysPress: () => void;
  /** Whether dark mode is enabled */
  isDarkMode: boolean;
  /** Callback when dark mode toggle changes */
  onDarkModeToggle: (value: boolean) => void;
  /** Callback when categories card is pressed */
  onCategoriesPress: () => void;
  /** Callback when clear data is pressed */
  onClearDataPress: () => void;
  /** Callback when feedback card is pressed */
  onFeedbackPress: () => void;
}

/**
 * DiagnosticSettingsSection component
 *
 * Combines all non-update, non-account settings sections into a single
 * component for cleaner main file organization.
 *
 * @param props - Component props
 * @returns DiagnosticSettingsSection component
 */
export function DiagnosticSettingsSection({
  notificationDays,
  onNotificationDaysPress,
  isDarkMode,
  onDarkModeToggle,
  onCategoriesPress,
  onClearDataPress,
  onFeedbackPress,
}: DiagnosticSettingsSectionProps): React.ReactElement {
  const { isDarkMode: themeDarkMode } = useTheme();

  const notificationCards = createNotificationCards(themeDarkMode);
  const appearanceCards = createAppearanceCards(themeDarkMode);
  const dataCards = createDataManagementCards(themeDarkMode);
  const supportCards = createSupportCards(themeDarkMode);

  return (
    <>
      {/* Notifications Section */}
      <SettingsSection title="Notifiche">
        {notificationCards.map((card) => (
          <SettingsCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            description={`Avvisami ${notificationDays} giorni prima`}
            onPress={onNotificationDaysPress}
          />
        ))}
      </SettingsSection>

      {/* Appearance Section */}
      <SettingsSection title="Aspetto">
        {appearanceCards.map((card) => (
          <SettingsCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            control={
              <Switch
                testID="dark-mode-switch"
                value={isDarkMode}
                onValueChange={onDarkModeToggle}
                trackColor={{ false: '#e5e7eb', true: '#818cf8' }}
                thumbColor={isDarkMode ? '#6366f1' : '#f1f5f9'}
                accessibilityLabel={card.accessibilityLabel}
              />
            }
          />
        ))}
      </SettingsSection>

      {/* Data Management Section */}
      <SettingsSection title="Gestione Dati">
        {dataCards.map((card) => (
          <SettingsCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            onPress={
              card.id === 'categories' ? onCategoriesPress : onClearDataPress
            }
          />
        ))}
      </SettingsSection>

      {/* Support Section */}
      <SettingsSection title="Informazioni e Supporto">
        {supportCards.map((card) => (
          <SettingsCard
            key={card.id}
            icon={card.icon}
            title={card.title}
            description={card.description}
            onPress={onFeedbackPress}
          />
        ))}
      </SettingsSection>
    </>
  );
}
