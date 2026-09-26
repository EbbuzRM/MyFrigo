// useExpirationStatus.ts — useExpirationStatus module.
//
// exports: useExpirationStatus | getExpirationStatusLabel | ExpirationStatusInfo
// used_by: components\ExpirationCard.tsx
//                   hooks\useProductStatus.ts

import { useMemo } from 'react';
import type { TFunction } from 'i18next';
import { differenceInCalendarDays } from 'date-fns';
import { COLORS } from '@/constants/colors';

export type ExpirationStatusInfo =
  | {
      status: 'frozen' | 'dateNotSet' | 'dateInvalid' | 'expired' | 'expiresToday';
      color: string;
      backgroundColor: string;
    }
  | {
      status: 'expiresInDays';
      daysUntil: number;
      color: string;
      backgroundColor: string;
    };

interface StatusColors {
  color: string;
  background: string;
}

type NonDayExpirationStatus = Exclude<ExpirationStatusInfo['status'], 'expiresInDays'>;

/** Resolve presentation copy from stable expiration state at UI boundary. */
export function getExpirationStatusLabel(status: ExpirationStatusInfo, t: TFunction): string {
  switch (status.status) {
    case 'frozen':
      return t('dashboard.statusFrozen');
    case 'dateNotSet':
      return t('dashboard.statusDateNotSet');
    case 'dateInvalid':
      return t('dashboard.statusDateInvalid');
    case 'expired':
      return t('dashboard.statusExpired');
    case 'expiresToday':
      return t('dashboard.statusExpiresToday');
    case 'expiresInDays':
      return t('dashboard.statusExpiresInDays', { count: status.daysUntil });
  }
}

/** Calculate stable expiration state and theme colors without embedding language. */
export function useExpirationStatus(
  expirationDate: string | undefined,
  isDarkMode: boolean,
  isFrozen?: boolean,
): ExpirationStatusInfo {
  return useMemo(() => {
    const statusColors = {
      good: {
        light: {
          color: COLORS.LIGHT.SUCCESS,
          background: COLORS.LIGHT.SUCCESS_LIGHT + '20',
        },
        dark: {
          color: COLORS.DARK.SUCCESS,
          background: COLORS.DARK.SUCCESS_DARK + '20',
        },
      },
      warning: {
        light: {
          color: COLORS.LIGHT.WARNING,
          background: COLORS.LIGHT.WARNING_LIGHT + '20',
        },
        dark: {
          color: COLORS.DARK.WARNING,
          background: COLORS.DARK.WARNING_DARK + '20',
        },
      },
      expired: {
        light: {
          color: COLORS.LIGHT.ERROR,
          background: COLORS.LIGHT.ERROR_LIGHT + '20',
        },
        dark: {
          color: COLORS.DARK.ERROR,
          background: COLORS.DARK.ERROR_DARK + '20',
        },
      },
      frozen: {
        light: {
          color: '#2563EB',
          background: '#2563EB20',
        },
        dark: {
          color: '#58a6ff',
          background: '#58a6ff20',
        },
      },
    };

    const theme = isDarkMode ? 'dark' : 'light';
    const createStatus = (status: NonDayExpirationStatus, colors: StatusColors) => ({
      status,
      color: colors.color,
      backgroundColor: colors.background,
    });

    if (isFrozen) {
      return createStatus('frozen', statusColors.frozen[theme]);
    }

    if (!expirationDate) {
      return createStatus('dateNotSet', statusColors.good[theme]);
    }

    const expDate = new Date(expirationDate);
    if (Number.isNaN(expDate.getTime())) {
      return createStatus('dateInvalid', statusColors.warning[theme]);
    }

    const daysUntil = differenceInCalendarDays(expDate, new Date());

    if (daysUntil < 0) {
      return createStatus('expired', statusColors.expired[theme]);
    }

    if (daysUntil === 0) {
      return createStatus('expiresToday', statusColors.warning[theme]);
    }

    const colors = daysUntil <= 3 ? statusColors.warning[theme] : statusColors.good[theme];
    return {
      status: 'expiresInDays',
      daysUntil,
      color: colors.color,
      backgroundColor: colors.background,
    };
  }, [expirationDate, isDarkMode, isFrozen]);
}
