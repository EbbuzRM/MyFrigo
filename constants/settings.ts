import { User, Calendar, Moon, ListTree, Trash2, RefreshCw, Download, MessageSquareQuote } from 'lucide-react-native';
import { router } from 'expo-router';
import React from 'react';

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
    title: 'Profilo',
    controlType: 'none',
    route: '/profile',
    accessibilityLabel: 'Profilo utente',
    accessibilityHint: 'Tocca per visualizzare e modificare il profilo',
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
    title: 'Giorni di Preavviso',
    description: 'Giorni prima della scadenza per le notifiche',
    controlType: 'none',
    settingKey: 'notificationDays',
    accessibilityLabel: 'Giorni di preavviso',
    accessibilityHint: 'Tocca per modificare quanti giorni prima ricevere le notifiche',
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
    title: 'Modalità Scura',
    controlType: 'switch',
    themeKey: 'dark',
    accessibilityLabel: 'Modalità scura',
    accessibilityHint: 'Attiva o disattiva la modalità scura',
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
    title: 'Gestisci Categorie',
    controlType: 'none',
    route: '/manage-categories',
    accessibilityLabel: 'Gestione categorie',
    accessibilityHint: 'Tocca per gestire le categorie dei prodotti',
  },
  {
    id: 'clear-data',
    section: 'data',
    icon: React.createElement(Trash2, { size: 24, color: getIconColor(isDarkMode, 'danger') }),
    title: 'Elimina Tutti i Dati',
    controlType: 'none',
    isAction: true,
    isDestructive: true,
    requiresConfirmation: true,
    accessibilityLabel: 'Elimina tutti i dati',
    accessibilityHint: 'Attenzione: questa azione eliminerà permanentemente tutti i dati',
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
    title: 'Controllo Automatico',
    description: 'Controlla automaticamente gli aggiornamenti',
    controlType: 'switch',
    updateKey: 'autoCheckEnabled',
    accessibilityLabel: 'Controllo automatico aggiornamenti',
    accessibilityHint: 'Attiva o disattiva il controllo automatico degli aggiornamenti',
  },
  {
    id: 'auto-install',
    section: 'updates',
    icon: React.createElement(Download, { size: 24, color: getIconColor(isDarkMode, 'info') }),
    title: 'Installazione Automatica',
    description: 'Installa automaticamente gli aggiornamenti',
    controlType: 'switch',
    updateKey: 'autoInstallEnabled',
    accessibilityLabel: 'Installazione automatica aggiornamenti',
    accessibilityHint: 'Attiva o disattiva l\'installazione automatica degli aggiornamenti',
  },
  {
    id: 'check-updates',
    section: 'updates',
    icon: React.createElement(RefreshCw, { size: 24, color: getIconColor(isDarkMode, 'primary') }),
    title: 'Controlla Aggiornamenti',
    controlType: 'indicator',
    updateKey: 'checkNow',
    showsStatus: true,
    accessibilityLabel: 'Controlla aggiornamenti',
    accessibilityHint: 'Tocca per verificare manualmente la disponibilità di aggiornamenti',
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
    title: 'Invia un Feedback',
    description: 'Segnala un bug o suggerisci un\'idea',
    controlType: 'none',
    route: '/feedback',
    accessibilityLabel: 'Invia feedback',
    accessibilityHint: 'Tocca per inviare feedback o segnalare problemi',
  },
];

/**
 * Get all settings sections configuration
 */
export const getSettingsSections = (isDarkMode: boolean): SettingsSectionConfig[] => [
  {
    id: 'account',
    title: 'Account',
    cards: createAccountCards(isDarkMode),
  },
  {
    id: 'notifications',
    title: 'Notifiche',
    cards: createNotificationCards(isDarkMode),
  },
  {
    id: 'appearance',
    title: 'Aspetto',
    cards: createAppearanceCards(isDarkMode),
  },
  {
    id: 'data',
    title: 'Gestione Dati',
    cards: createDataManagementCards(isDarkMode),
  },
  {
    id: 'updates',
    title: 'Aggiornamenti',
    cards: createUpdateCards(isDarkMode),
  },
  {
    id: 'support',
    title: 'Informazioni e Supporto',
    cards: createSupportCards(isDarkMode),
  },
];
