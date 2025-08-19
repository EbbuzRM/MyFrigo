import { useMemo } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';
import { COLORS } from '@/constants/colors';

/**
 * @hook useExpirationStatus
 * @description Hook personalizzato che calcola lo stato di scadenza di un prodotto.
 * Restituisce un oggetto contenente un testo descrittivo (es. "Scade oggi") e i colori
 * appropriati per lo sfondo e il testo, adattandosi al tema chiaro/scuro.
 * @param {string|undefined} expirationDate - La data di scadenza del prodotto in formato stringa ISO o undefined.
 * @returns {{text: string, color: string, backgroundColor: string}} Lo stato di scadenza calcolato.
 */
export function useExpirationStatus(expirationDate: string | undefined) {
  const { isDarkMode } = useTheme();

  const status = useMemo(() => {
    // Utilizziamo i colori centralizzati
    const statusColors = {
      good: {
        light: {
          color: COLORS.LIGHT.SUCCESS,
          background: COLORS.LIGHT.SUCCESS_LIGHT + '20' // Aggiungiamo trasparenza
        },
        dark: {
          color: COLORS.DARK.SUCCESS,
          background: COLORS.DARK.SUCCESS_DARK + '20'
        },
      },
      warning: {
        light: {
          color: COLORS.LIGHT.WARNING,
          background: COLORS.LIGHT.WARNING_LIGHT + '20'
        },
        dark: {
          color: COLORS.DARK.WARNING,
          background: COLORS.DARK.WARNING_DARK + '20'
        },
      },
      expired: {
        light: {
          color: COLORS.LIGHT.ERROR,
          background: COLORS.LIGHT.ERROR_LIGHT + '20'
        },
        dark: {
          color: COLORS.DARK.ERROR,
          background: COLORS.DARK.ERROR_DARK + '20'
        },
      },
    };

    const theme = isDarkMode ? 'dark' : 'light';

    // Se la data di scadenza non è definita, restituisci uno stato predefinito
    if (!expirationDate) {
      const { color, background } = statusColors.good[theme];
      return { text: 'Data non impostata', color, backgroundColor: background };
    }

    const now = new Date();
    const expDate = new Date(expirationDate);
    
    // Verifica che la data sia valida
    if (isNaN(expDate.getTime())) {
      const { color, background } = statusColors.warning[theme];
      return { text: 'Data non valida', color, backgroundColor: background };
    }
    
    const daysUntil = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      const { color, background } = statusColors.expired[theme];
      return { text: 'Scaduto', color, backgroundColor: background };
    } else if (daysUntil === 0) {
      const { color, background } = statusColors.warning[theme];
      return { text: 'Scade oggi', color, backgroundColor: background };
    } else if (daysUntil <= 3) {
      const { color, background } = statusColors.warning[theme];
      return { text: `${daysUntil} giorni`, color, backgroundColor: background };
    } else {
      const { color, background } = statusColors.good[theme];
      return { text: `${daysUntil} giorni`, color, backgroundColor: background };
    }
  }, [expirationDate, isDarkMode]);

  return status;
}
