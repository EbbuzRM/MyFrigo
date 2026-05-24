// AccountSettingsSection.tsx — AccountSettingsSection module.
//
// exports: AccountSettingsSectionProps | AccountSettingsSection
// used_by: app\(tabs)\settings.tsx
// rules:   - The `SettingsSection` wrapper must not be removed or modified, as it provides consistent layout and title rendering for all settings sections.
//          - The `cards` array must remain derived from `createAccountCards()` to ensure alignment with centralized settings card definitions.
//          - All interactive elements must use the `SettingsCard` component for consistent styling and behavior across settings.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { SettingsCard } from '@/components/SettingsCard';
import { SettingsSection } from './SettingsSection';
import { createAccountCards } from '@/constants/settings';

/**
 * @file components/settings/AccountSettingsSection.tsx
 * @description Section component for account-related settings.
 * Manages profile navigation and account preferences including password change.
 *
 * @example
 * ```tsx
 * <AccountSettingsSection
 *   onProfilePress={() => router.push('/profile')}
 *   onChangePasswordPress={() => setModalVisible(true)}
 * />
 * ```
 */

/**
 * Props for AccountSettingsSection component
 */
export interface AccountSettingsSectionProps {
  /** Callback when profile card is pressed */
  onProfilePress: () => void;
  /** Callback when change password card is pressed */
  onChangePasswordPress: () => void;
}

/**
 * AccountSettingsSection component
 *
 * Displays account-related settings including profile access
 * and password change functionality.
 *
 * @param props - Component props
 * @returns AccountSettingsSection component
 */
export function AccountSettingsSection({
  onProfilePress,
  onChangePasswordPress,
}: AccountSettingsSectionProps): React.ReactElement {
  const { isDarkMode } = useTheme();
  const cards = createAccountCards(isDarkMode);

  const handleCardPress = (card: ReturnType<typeof createAccountCards>[number]) => {
    if (card.action === 'change-password') {
      onChangePasswordPress();
    } else if (card.route) {
      onProfilePress();
    }
  };

  return (
    <SettingsSection title="Account">
      {cards.map((card) => (
        <SettingsCard
          key={card.id}
          icon={card.icon}
          title={card.title}
          description={card.description}
          onPress={() => handleCardPress(card)}
          accessibilityLabel={card.accessibilityLabel}
          accessibilityHint={card.accessibilityHint}
        />
      ))}
    </SettingsSection>
  );
}
