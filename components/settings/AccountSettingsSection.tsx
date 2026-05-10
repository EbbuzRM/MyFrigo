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
import { SettingsCard } from '@/components/SettingsCard';
import { SettingsSection } from './SettingsSection';
import { createAccountCards } from '@/constants/settings';

/**
 * @file components/settings/AccountSettingsSection.tsx
 * @description Section component for account-related settings.
 * Manages profile navigation and account preferences.
 *
 * @example
 * ```tsx
 * <AccountSettingsSection onProfilePress={() => router.push('/profile')} />
 * ```
 */

/**
 * Props for AccountSettingsSection component
 */
export interface AccountSettingsSectionProps {
  /** Callback when profile card is pressed */
  onProfilePress: () => void;
}

/**
 * AccountSettingsSection component
 *
 * Displays account-related settings including profile access.
 *
 * @param props - Component props
 * @returns AccountSettingsSection component
 */
export function AccountSettingsSection({
  onProfilePress,
}: AccountSettingsSectionProps): React.ReactElement {
  const cards = createAccountCards(false); // isDarkMode not needed for account cards

  return (
    <SettingsSection title="Account">
      {cards.map((card) => (
        <SettingsCard
          key={card.id}
          icon={card.icon}
          title={card.title}
          onPress={onProfilePress}
        />
      ))}
    </SettingsSection>
  );
}
