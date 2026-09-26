// settings.ts — settings module.
//
// exports: NOTIFICATION_DAYS_OPTIONS | DEFAULT_NOTIFICATION_DAYS | MIN_NOTIFICATION_DAYS | MAX_NOTIFICATION_DAYS | DIAGNOSTIC_LONG_PRESS_DURATION | DIAGNOSTIC_PROGRESS_INTERVAL | CardControlType | SettingsCardConfig | AccountCardConfig | NotificationCardConfig | AppearanceCardConfig | DataManagementCardConfig | UpdateCardConfig | SupportCardConfig | SettingsCardUnion | SettingsSectionConfig | getIconColor | createAccountCards | createNotificationCards | createAppearanceCards | (+4 more)
// used_by: components\settings\AccountSettingsSection.tsx
//                   components\settings\DiagnosticSettingsSection.tsx
//                   components\settings\NotificationDaysModal.tsx
//                   components\settings\UpdateSettingsSection.tsx
//                   hooks\useSettingsSections.ts
// rules:   This file defines all settings UI structure declaratively; do NOT create new settings components or cards outside of this module—add them only via the factory functions and interfaces defined here. Maintain strict separation between configuration (this file) and rendering logic (components using these exports).
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { User, Calendar, Moon, ListTree, Trash2, RefreshCw, Download, MessageSquareQuote, Lock } from 'lucide-react-native';
import React from 'react';
import i18next from 'i18next';

/**
 * @file constants/settings.ts
 * @description Centralized configuration for all settings sections and cards.
 * This file provides a declarative way to define settings UI structure,
 * making it easy to add, remove, or modify settings without touching component logic.
 */

/**
 * Available notification day options for user selection
 */
export const NOTIFICATION_DAYS_OPTIONS = [1, 2, 3, 5, 7, 14, 30] as const;

/**
 * Default notification days value
 */
export const DEFAULT_NOTIFICATION_DAYS = 3;

/**
 * Minimum allowed notification days
 */
export const MIN_NOTIFICATION_DAYS = 1;

/**
 * Maximum allowed notification days
 */
export const MAX_NOTIFICATION_DAYS = 30;

/**
 * Long press duration in milliseconds to trigger diagnostic panel
 */
export const DIAGNOSTIC_LONG_PRESS_DURATION = 5000;

/**
 * Progress update interval in milliseconds for diagnostic long press
 */
export const DIAGNOSTIC_PROGRESS_INTERVAL = 100;

/**
 * Type for card control type
 */
export type CardControlType = 'switch' | 'none' | 'indicator';

/**
 * Base interface for all settings cards
 */
export interface SettingsCardConfig {
  /** Unique identifier for the card */
  id: string;
  /** Icon component to display */
  icon: React.ReactNode;
  /** Card title */
  title: string;
  /** Optional description text */
  description?: string;
  /** Type of control to show on the right side */
  controlType: CardControlType;
  /** Navigation route for cards with onPress */
  route?: string;
  /** Whether this card triggers an action instead of navigation */
  isAction?: boolean;
  /** Action identifier for cards that trigger actions instead of navigation */
  action?: string;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint for screen readers */
  accessibilityHint?: string;
}

/**
 * Interface for account section cards
 */
export interface AccountCardConfig extends SettingsCardConfig {
  section: 'account';
}

/**
 * Interface for notification section cards
 */
export interface NotificationCardConfig extends SettingsCardConfig {
  section: 'notifications';
  /** Key for the setting value in settings context */
  settingKey: string;
}

/**
 * Interface for appearance section cards
 */
export interface AppearanceCardConfig extends SettingsCardConfig {
  section: 'appearance';
  /** Key for the theme setting */
  themeKey: 'dark' | 'light';
}

/**
 * Interface for data management section cards
 */
export interface DataManagementCardConfig extends SettingsCardConfig {
  section: 'data';
  /** Whether this action requires confirmation */
  requiresConfirmation?: boolean;
  /** Whether this is a destructive action */
  isDestructive?: boolean;
}

/**
 * Interface for update section cards
 */
export interface UpdateCardConfig extends SettingsCardConfig {
  section: 'updates';
  /** Key for the update setting */
  updateKey: string;
  /** Whether this shows update status */
  showsStatus?: boolean;
}

/**
 * Interface for support section cards
 */
export interface SupportCardConfig extends SettingsCardConfig {
  section: 'support';
}

/**
 * Union type for all card configurations
 */
export type SettingsCardUnion =
  | AccountCardConfig
  | NotificationCardConfig
  | AppearanceCardConfig
  | DataManagementCardConfig
  | UpdateCardConfig
  | SupportCardConfig;

/**
 * Configuration for a settings section
 */
export interface SettingsSectionConfig {
  /** Section identifier */
  id: string;
  /** Section title displayed in UI */
  title: string;
  /** Cards belonging to this section */
  cards: SettingsCardUnion[];
}

/**
 * Get icon color based on theme and icon type
 */
export const getIconColor = (isDarkMode: boolean, type: 'primary' | 'warning' | 'success' | 'danger' | 'info'): string => {
  const colors = {
    primary: isDarkMode ? '#a78bfa' : '#7c3aed',
    warning: isDarkMode ? '#fcd34d' : '#f59e0b',
    success: isDarkMode ? '#4ade80' : '#16a34a',
    danger: isDarkMode ? '#f87171' : '#dc2626',
    info: isDarkMode ? '#3b82f6' : '#2563eb',
  };
  return colors[type];
};

/**
 * Factory function to create account section cards
 */
export const createAccountCards = (isDarkMode: boolean): AccountCardConfig[] => [
  {
    id: 'profile',
    section: 'account',
    icon: React.createElement(User, { size: 24, color: getIconColor(isDarkMode, 'primary') }),
    title: i18next.t('settings.profile'),
    controlType: 'none',
    route: '/profile',
    accessibilityLabel: i18next.t('settings.profileLabel'),
    accessibilityHint: i18next.t('settings.profileHint'),
  },
  {
    id: 'change-password',
    section: 'account',
    icon: React.createElement(Lock, { size: 24, color: getIconColor(isDarkMode, 'info') }),
    title: i18next.t('settings.changePassword'),
    description: i18next.t('settings.changePasswordDescription'),
    controlType: 'none',
    action: 'change-password',
    accessibilityLabel: i18next.t('settings.changePassword'),
    accessibilityHint: i18next.t('settings.changePasswordHint'),
  },
];

/**
 * Factory function to create notification section cards
 */
export const createNotificationCards = (isDarkMode: boolean): NotificationCardConfig[] => [
  {
    id: 'notification-days',
    section: 'notifications',
    icon: React.createElement(Calendar, { size: 24, color: getIconColor(isDarkMode, 'warning') }),
    title: i18next.t('settings.notificationDays'),
    description: i18next.t('settings.notificationDaysDescription'),
    controlType: 'none',
    settingKey: 'notificationDays',
    accessibilityLabel: i18next.t('settings.notificationDays'),
    accessibilityHint: i18next.t('settings.notificationDaysHint'),
  },
];

/**
 * Factory function to create appearance section cards
 */
export const createAppearanceCards = (isDarkMode: boolean): AppearanceCardConfig[] => [
  {
    id: 'dark-mode',
    section: 'appearance',
    icon: isDarkMode
      ? React.createElement(Moon, { size: 24, color: '#818cf8' })
      : React.createElement(Moon, { size: 24, color: getIconColor(isDarkMode, 'warning') }),
    title: i18next.t('settings.darkMode'),
    controlType: 'switch',
    themeKey: 'dark',
    accessibilityLabel: i18next.t('settings.darkMode'),
    accessibilityHint: i18next.t('settings.darkModeHint'),
  },
];

/**
 * Factory function to create data management section cards
 */
export const createDataManagementCards = (isDarkMode: boolean): DataManagementCardConfig[] => [
  {
    id: 'categories',
    section: 'data',
    icon: React.createElement(ListTree, { size: 24, color: getIconColor(isDarkMode, 'success') }),
    title: i18next.t('settings.manageCategories'),
    controlType: 'none',
    route: '/manage-categories',
    accessibilityLabel: i18next.t('settings.manageCategoriesLabel'),
    accessibilityHint: i18next.t('settings.manageCategoriesHint'),
  },
  {
    id: 'clear-data',
    section: 'data',
    icon: React.createElement(Trash2, { size: 24, color: getIconColor(isDarkMode, 'danger') }),
    title: i18next.t('settings.clearData'),
    controlType: 'none',
    isAction: true,
    isDestructive: true,
    requiresConfirmation: true,
    accessibilityLabel: i18next.t('settings.clearData'),
    accessibilityHint: i18next.t('settings.clearDataHint'),
  },
];

/**
 * Factory function to create update section cards
 */
export const createUpdateCards = (isDarkMode: boolean): UpdateCardConfig[] => [
  {
    id: 'auto-check',
    section: 'updates',
    icon: React.createElement(RefreshCw, { size: 24, color: getIconColor(isDarkMode, 'success') }),
    title: i18next.t('settings.autoCheck'),
    description: i18next.t('settings.autoCheckDescription'),
    controlType: 'switch',
    updateKey: 'autoCheckEnabled',
    accessibilityLabel: i18next.t('settings.autoCheckLabel'),
    accessibilityHint: i18next.t('settings.autoCheckHint'),
  },
  {
    id: 'auto-install',
    section: 'updates',
    icon: React.createElement(Download, { size: 24, color: getIconColor(isDarkMode, 'info') }),
    title: i18next.t('settings.autoInstall'),
    description: i18next.t('settings.autoInstallDescription'),
    controlType: 'switch',
    updateKey: 'autoInstallEnabled',
    accessibilityLabel: i18next.t('settings.autoInstallLabel'),
    accessibilityHint: i18next.t('settings.autoInstallHint'),
  },
  {
    id: 'check-updates',
    section: 'updates',
    icon: React.createElement(RefreshCw, { size: 24, color: getIconColor(isDarkMode, 'primary') }),
    title: i18next.t('settings.checkUpdates'),
    controlType: 'indicator',
    updateKey: 'checkNow',
    showsStatus: true,
    accessibilityLabel: i18next.t('settings.checkUpdates'),
    accessibilityHint: i18next.t('settings.checkUpdatesHint'),
  },
];

/**
 * Factory function to create support section cards
 */
export const createSupportCards = (isDarkMode: boolean): SupportCardConfig[] => [
  {
    id: 'feedback',
    section: 'support',
    icon: React.createElement(MessageSquareQuote, { size: 24, color: getIconColor(isDarkMode, 'primary') }),
    title: i18next.t('settings.feedback'),
    description: i18next.t('settings.feedbackDescription'),
    controlType: 'none',
    route: '/feedback',
    accessibilityLabel: i18next.t('settings.feedback'),
    accessibilityHint: i18next.t('settings.feedbackHint'),
  },
];

/**
 * Get all settings sections configuration
 */
export const getSettingsSections = (isDarkMode: boolean): SettingsSectionConfig[] => [
  {
    id: 'account',
    title: i18next.t('settings.account'),
    cards: createAccountCards(isDarkMode),
  },
  {
    id: 'notifications',
    title: i18next.t('settings.notifications'),
    cards: createNotificationCards(isDarkMode),
  },
  {
    id: 'appearance',
    title: i18next.t('settings.appearance'),
    cards: createAppearanceCards(isDarkMode),
  },
  {
    id: 'data',
    title: i18next.t('settings.dataManagement'),
    cards: createDataManagementCards(isDarkMode),
  },
  {
    id: 'updates',
    title: i18next.t('settings.updates'),
    cards: createUpdateCards(isDarkMode),
  },
  {
    id: 'support',
    title: i18next.t('settings.support'),
    cards: createSupportCards(isDarkMode),
  },
];
