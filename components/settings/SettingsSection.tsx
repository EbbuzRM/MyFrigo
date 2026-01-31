import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { scaleFont } from '@/utils/scaleFont';

/**
 * @file components/settings/SettingsSection.tsx
 * @description Reusable section wrapper component for settings screen.
 * Provides consistent styling and structure for all settings sections.
 *
 * @example
 * ```tsx
 * <SettingsSection title="Account">
 *   <SettingsCard ... />
 *   <SettingsCard ... />
 * </SettingsSection>
 * ```
 */

/**
 * Props for SettingsSection component
 */
export interface SettingsSectionProps {
  /** Section title displayed above cards */
  title: string;
  /** Child components (typically SettingsCard components) */
  children: React.ReactNode;
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * SettingsSection component
 *
 * Wraps a group of settings cards with a section title.
 * Provides consistent spacing, typography, and theming.
 *
 * @param props - Component props
 * @returns SettingsSection component
 */
export function SettingsSection({ title, children, testID }: SettingsSectionProps): React.ReactElement {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.section} testID={testID} accessibilityLabel={title}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

/**
 * Styles for the SettingsSection component
 */
const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    section: {
      paddingHorizontal: 20,
      marginVertical: 12,
    },
    sectionTitle: {
      fontSize: scaleFont(16),
      fontFamily: 'Inter-SemiBold',
      color: isDarkMode ? '#8b949e' : '#64748b',
      marginBottom: 12,
    },
  });
