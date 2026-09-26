// HistoryCardStatus.tsx — HistoryCardStatus module.
//
// exports: HistoryStatus | useStatusInfo | formatHistoryDate
// used_by: components\HistoryCard.tsx
// rules:   - The `StatusInfo` interface and status color objects (`CONSUMED_COLORS`, `EXPIRED_COLORS`) define the canonical data structure for status theming and must remain consistent across all status-related components
//          - Theme colors are mapped exclusively through the `isDarkMode` boolean pattern; no additional theme provider or context should be introduced for status color resolution
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useMemo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { formatDisplayDate } from '@/i18n/format';
import type { SupportedLanguage } from '@/i18n/types';

export type HistoryStatus = 'consumed' | 'expired';

interface StatusInfo {
  /** Icon component for the status */
  icon: React.ReactNode;
  /** Background color for status theming */
  backgroundColor: string;
  /** Border color for the card */
  borderColor: string;
  /** Primary color for text and indicators */
  color: string;
  /** Raw date value */
  date: string | undefined;
}

interface HistoryCardStatusProps {
  /** Status type */
  type: HistoryStatus;
  /** Whether dark mode is enabled */
  isDarkMode: boolean;
  /** Date value (consumedDate or expirationDate) */
  date: string | undefined;
}

/**
 * Theme colors for consumed status
 */
const CONSUMED_COLORS = {
  light: {
    color: '#16a34a',
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  dark: {
    color: '#4ade80',
    backgroundColor: '#142e1f',
    borderColor: '#1c4b2a',
  },
};

/**
 * Theme colors for expired status
 */
const EXPIRED_COLORS = {
  light: {
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  dark: {
    color: '#f87171',
    backgroundColor: '#311919',
    borderColor: '#5b2121',
  },
};

/**
 * Hook to get memoized status information
 * @description Returns status info with icons and colors based on type and theme.
 * Uses useMemo to prevent object recreation on every render.
 */
export function useStatusInfo({
  type,
  isDarkMode,
  date,
}: HistoryCardStatusProps): StatusInfo {
  return useMemo(() => {
    const colors = isDarkMode
      ? type === 'consumed'
        ? CONSUMED_COLORS.dark
        : EXPIRED_COLORS.dark
      : type === 'consumed'
        ? CONSUMED_COLORS.light
        : EXPIRED_COLORS.light;

    const IconComponent =
      type === 'consumed' ? (
        <CheckCircle size={24} color={colors.color} />
      ) : (
        <XCircle size={24} color={colors.color} />
      );

    return {
      icon: IconComponent,
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
      color: colors.color,
      date,
    };
  }, [type, isDarkMode, date]);
}

/**
 * Format date for display
 * @param date - Date string to format
 * @returns Formatted date string in Italian locale
 */
export function formatHistoryDate(date: string | undefined, language: SupportedLanguage = 'it'): string {
  if (!date) return '';
  return formatDisplayDate(date, language) ?? '';
}
